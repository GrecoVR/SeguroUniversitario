-- Todos los usuarios de prueba comparten el hash provisional del admin
INSERT INTO usuarios (ci, nombres, apellido_paterno, apellido_materno, correo, contrasena, rol) VALUES
('7000001', 'Juan', 'Pérez', 'Rojas',  'medico1@ssu.edu.bo', '$2a$10$E8zU344/BglXp9f/C39Wuu5MBy8qQ4Z./w4SjH0qfB0uE2Jz6b5eK', 'MEDICO'),
('7000002', 'Ana',  'Gómez', 'Vargas', 'medico2@ssu.edu.bo', '$2a$10$E8zU344/BglXp9f/C39Wuu5MBy8qQ4Z./w4SjH0qfB0uE2Jz6b5eK', 'MEDICO')
ON CONFLICT DO NOTHING;

INSERT INTO medicos (id_medico, especialidad, consultorio, matricula)
SELECT id_usuario, 'Medicina General', 'Consultorio 1', 'M-0001' FROM usuarios WHERE correo = 'medico1@ssu.edu.bo'
UNION ALL
SELECT id_usuario, 'Odontología', 'Consultorio 3', 'M-0002' FROM usuarios WHERE correo = 'medico2@ssu.edu.bo'
ON CONFLICT DO NOTHING;

INSERT INTO fechas_disponibles (id_medico, fecha)
SELECT id_usuario, CURRENT_DATE + 1 FROM usuarios
WHERE correo IN ('medico1@ssu.edu.bo', 'medico2@ssu.edu.bo')
ON CONFLICT DO NOTHING;

INSERT INTO horarios (id_fecha, hora_inicio, hora_fin)
SELECT f.id_fecha, t.ini::time, t.fin::time
FROM fechas_disponibles f
JOIN usuarios u ON u.id_usuario = f.id_medico
CROSS JOIN (VALUES ('08:00','08:30'),('08:30','09:00'),('09:00','09:30'),('09:30','10:00')) AS t(ini, fin)
WHERE u.correo IN ('medico1@ssu.edu.bo', 'medico2@ssu.edu.bo') AND f.fecha = CURRENT_DATE + 1;