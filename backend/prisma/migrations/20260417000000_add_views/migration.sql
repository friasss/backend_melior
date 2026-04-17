-- Vista: todos los usuarios con info completa
CREATE OR REPLACE VIEW v_usuarios AS
SELECT
  u.id,
  u.first_name                           AS nombre,
  u.last_name                            AS apellido,
  CONCAT(u.first_name, ' ', u.last_name) AS nombre_completo,
  u.email,
  u.phone                                AS telefono,
  u.role                                 AS rol,
  u.email_verified                       AS email_verificado,
  u.is_active                            AS activo,
  u.avatar_url                           AS foto,
  u.created_at                           AS registrado_en
FROM users u
ORDER BY u.created_at DESC;

-- Vista: agentes con su info de usuario y estadísticas
CREATE OR REPLACE VIEW v_agentes AS
SELECT
  u.id                                   AS usuario_id,
  CONCAT(u.first_name, ' ', u.last_name) AS nombre_completo,
  u.email,
  u.phone                                AS telefono,
  ap.company                             AS empresa,
  ap.bio,
  ap.years_experience                    AS años_experiencia,
  ap.rating                              AS calificacion,
  ap.total_sales                         AS total_ventas,
  ap.is_verified                         AS verificado,
  COUNT(DISTINCT p.id)                   AS propiedades_activas,
  u.created_at                           AS registrado_en
FROM users u
INNER JOIN agent_profiles ap ON ap.user_id = u.id
LEFT JOIN properties p ON p.agent_id = ap.id AND p.listing_status = 'ACTIVE'
GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone,
         ap.company, ap.bio, ap.years_experience, ap.rating,
         ap.total_sales, ap.is_verified, u.created_at
ORDER BY u.created_at DESC;

-- Vista: consultas con info del contacto y la propiedad
CREATE OR REPLACE VIEW v_consultas AS
SELECT
  ci.id,
  CONCAT(ci.first_name, ' ', ci.last_name) AS nombre_contacto,
  ci.email,
  ci.phone                                  AS telefono,
  ci.subject                                AS asunto,
  ci.message                                AS mensaje,
  ci.status                                 AS estado,
  p.title                                   AS propiedad,
  CONCAT(u.first_name, ' ', u.last_name)    AS agente,
  ci.created_at                             AS fecha
FROM contact_inquiries ci
LEFT JOIN properties p     ON p.id = ci.property_id
LEFT JOIN agent_profiles ap ON ap.id = p.agent_id
LEFT JOIN users u           ON u.id = ap.user_id
ORDER BY ci.created_at DESC;

-- Vista: propiedades con agente, dirección, fotos y estadísticas
CREATE OR REPLACE VIEW v_propiedades AS
SELECT
  p.id,
  p.title                                    AS titulo,
  p.price                                    AS precio,
  p.currency                                 AS moneda,
  p.status                                   AS operacion,
  p.property_type                            AS tipo,
  p.listing_status                           AS estado_listing,
  p.beds                                     AS habitaciones,
  p.baths                                    AS baños,
  p.size                                     AS metros,
  a.city                                     AS ciudad,
  a.neighborhood                             AS sector,
  CONCAT(u.first_name, ' ', u.last_name)     AS agente,
  u.email                                    AS email_agente,
  p.view_count                               AS vistas,
  COUNT(DISTINCT f.id)                       AS favoritos,
  COUNT(DISTINCT ci.id)                      AS consultas,
  p.is_featured                              AS destacada,
  p.created_at                               AS publicada_en
FROM properties p
INNER JOIN agent_profiles ap  ON ap.id = p.agent_id
INNER JOIN users u             ON u.id = ap.user_id
LEFT  JOIN addresses a         ON a.id = p.address_id
LEFT  JOIN favorites f         ON f.property_id = p.id
LEFT  JOIN contact_inquiries ci ON ci.property_id = p.id
GROUP BY p.id, p.title, p.price, p.currency, p.status, p.property_type,
         p.listing_status, p.beds, p.baths, p.size, a.city, a.neighborhood,
         u.first_name, u.last_name, u.email, p.view_count, p.is_featured, p.created_at
ORDER BY p.created_at DESC;
