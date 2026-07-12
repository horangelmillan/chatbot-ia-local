TRUNCATE faq CASCADE;

INSERT INTO faq (code, question, answer, category, keywords)
VALUES
  ('E2E-FAQ-001', '¿Como facturar?', 'Debes seguir estos pasos: 1. Inicia sesion 2. Ve a facturacion 3. Descarga tu factura', 'Facturacion', ARRAY['factura', 'facturar', 'pasos']),
  ('E2E-FAQ-002', '¿Cual es el horario de atencion?', 'Nuestro horario es de lunes a viernes de 9:00 a 18:00', 'Soporte', ARRAY['horario', 'atencion']),
  ('E2E-FAQ-003', '¿Como restablecer mi contrasena?', 'Puedes restablecer tu contrasena desde la opcion "Olvide mi contrasena" en la pantalla de inicio', 'Cuenta', ARRAY['contrasena', 'password', 'restablecer']);
