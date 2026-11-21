-- ==========================================================================
-- MIGRACIÓN DE PROPUESTAS DESDE ACCESS A POSTGRESQL (PRODUCCIÓN)
-- Tabla origen: Propu_Detalle (curare.mdb)
-- Tablas destino: propuestas, propuesta_detalle
-- Fecha de generación: 2026-11-21T16:44:48.795Z
-- ==========================================================================

BEGIN;

-- 1. Insertar aranceles faltantes si no existen en arancel
INSERT INTO arancel (codigo, detalle, precio1, precio2, tc, estado, "idEspecialidad", "createdAt", "updatedAt")
SELECT '06.62', 'CORONA PORCELANA PURA (CAD - CAM)', 5690, 5690, 1.0, 'activo', 6, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM arancel WHERE codigo = '06.62');
INSERT INTO arancel (codigo, detalle, precio1, precio2, tc, estado, "idEspecialidad", "createdAt", "updatedAt")
SELECT '04.14', 'RESELLADO DE RESTAURACIONES', 170, 170, 1.0, 'activo', 4, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM arancel WHERE codigo = '04.14');
INSERT INTO arancel (codigo, detalle, precio1, precio2, tc, estado, "idEspecialidad", "createdAt", "updatedAt")
SELECT '08.05', 'PROTESIS SOBRE IMPLANTES', 7360, 7360, 1.0, 'activo', 8, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM arancel WHERE codigo = '08.05');
INSERT INTO arancel (codigo, detalle, precio1, precio2, tc, estado, "idEspecialidad", "createdAt", "updatedAt")
SELECT '06.20', 'PROTESIS PARCIAL PROVISIONAL', 1680, 1680, 1.0, 'activo', 6, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM arancel WHERE codigo = '06.20');
INSERT INTO arancel (codigo, detalle, precio1, precio2, tc, estado, "idEspecialidad", "createdAt", "updatedAt")
SELECT '06.12', 'CORONA PORCELANA PURA (INCERAM)', 3530, 3530, 1.0, 'activo', 6, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM arancel WHERE codigo = '06.12');
INSERT INTO arancel (codigo, detalle, precio1, precio2, tc, estado, "idEspecialidad", "createdAt", "updatedAt")
SELECT '06.59', 'PROTESIS TOTAL PROVISIONAL', 0, 0, 1.0, 'activo', 6, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM arancel WHERE codigo = '06.59');
INSERT INTO arancel (codigo, detalle, precio1, precio2, tc, estado, "idEspecialidad", "createdAt", "updatedAt")
SELECT '06.73', 'PROTESIS PROVISIONAL BILATERAL ACRILICO', 0, 0, 1.0, 'activo', 6, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM arancel WHERE codigo = '06.73');
INSERT INTO arancel (codigo, detalle, precio1, precio2, tc, estado, "idEspecialidad", "createdAt", "updatedAt")
SELECT '06.22', 'PROTESIS TOTAL ACRILICO ADHESIVO SUP. O INF.', 0, 0, 1.0, 'activo', 6, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM arancel WHERE codigo = '06.22');
INSERT INTO arancel (codigo, detalle, precio1, precio2, tc, estado, "idEspecialidad", "createdAt", "updatedAt")
SELECT '08.35', 'PROTESIS PROVISIONAL UNILATERAL FLEXIBLE', 0, 0, 1.0, 'activo', 8, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM arancel WHERE codigo = '08.35');

-- Sincronizar secuencias antes de insertar para que inicien por encima del MAX(id) actual
SELECT setval('propuestas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM propuestas));
SELECT setval('propuesta_detalle_id_seq', (SELECT COALESCE(MAX(id), 1) FROM propuesta_detalle));

-- 2. Insertar cabeceras y detalles de propuestas desde Access
DO $$
DECLARE
    v_id INT;
BEGIN

    -- Paciente 1801 | Fecha: 2019-07-02 | Total: 28920.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1801, 1, '2019-07-02', 28920.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '24/26/27', 3, 17070.00, 0.00, 17070.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3950.00, 1.00, '24/26/27', 3, 11850.00, 0.00, 11850.00, false);

    -- Paciente 2139 | Fecha: 2018-10-11 | Total: 37100.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2139, 1, '2018-10-11', 37100.00, '{"A":"UNA VEZ REALIZADO EL DIAGNOSTICO Y ENCERADO SE VALORARA LAS OBTURACIONES EN PIAZAS INFERIORES Y EL RETIRO DE CORONA EN PIEZA 27","B":"EN ELEMENTOS DENTARIOS 13 /23 POSIBLE TRATAMIENTO DE CONDUCTOS"}', 13)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '11/21/12/22/14', 5, 5050.00, 20.00, 4040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '33/32/31/41/42/43', 6, 3840.00, 20.00, 3072.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '27/25//37', 3, 1920.00, 70.00, 576.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '27/25/17/16/45/37', 6, 3840.00, 20.00, 3072.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 86, 640.00, 1.00, '21', 1, 640.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 111, 1980.00, 1.00, NULL, 2, 3960.00, 50.00, 1980.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 244, 1520.00, 1.00, NULL, 1, 1520.00, 20.00, 1520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1010.00, 1.00, '11/12/21/22/14', 5, 5050.00, 20.00, 4040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 249, 640.00, 1.00, '13/23', 2, 1280.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 640.00, 1.00, '13/23', 2, 1280.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5690.00, 1.00, '13/21', 2, 11380.00, 20.00, 9104.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 640.00, 1.00, '16/17/37', 3, 1920.00, 20.00, 1536.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 640.00, 1.00, '33/32/31/41/42/43', 6, 3840.00, 20.00, 3072.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '35/45', 2, 6360.00, 20.00, 5088.00, false);

    -- Paciente 2139 | Fecha: 2018-10-29 | Total: 22200.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2139, 1, '2018-10-29', 22200.00, '{"A":"EN ELEMENTOS DENTARIOS 13/23 POSIBLE TRATAMIENTO DE CONDUCTOS"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '11/12/21/22/14', 5, 5050.00, 20.00, 4040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 86, 640.00, 1.00, '21', 1, 640.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '13/23', 2, 1280.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '13/23', 2, 1280.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '13/23', 2, 11380.00, 20.00, 9104.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '16/17/37', 3, 1920.00, 20.00, 1536.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '33/32/31/41/42/43', 6, 3840.00, 50.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '35/45', 2, 6360.00, 20.00, 5088.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '34', 1, 640.00, 20.00, 512.00, false);

    -- Paciente 871 | Fecha: 2018-10-17 | Total: 3130.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (871, 1, '2018-10-17', 3130.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '11/41/42', 3, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1210.00, 1.00, NULL, 1, 1210.00, 0.00, 1210.00, false);

    -- Paciente 1707 | Fecha: 2015-12-29 | Total: 28280.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1707, 1, '2015-12-29', 28280.00, '{"A":"MAXILAR SUPERIOR"}', 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '17/16/15/14/24/25', 6, 17340.00, 0.00, 17340.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '27', 1, 2890.00, 0.00, 2890.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1130.00, 1.00, '13/23', 2, 2260.00, 0.00, 2260.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 920.00, 1.00, '26', 1, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 218, 4870.00, 1.00, '26', 1, 4870.00, 0.00, 4870.00, false);

    -- Paciente 1707 | Fecha: 2015-12-29 | Total: 26060.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1707, 1, '2015-12-29', 26060.00, '{"B":"MAILAR INFERIOR *POSIBLE TRATAMIENTO DE CONDUCTOS PZA. 35 BS 2210, POSIBLE PERNO+MUÑON BS. 1390, POSIBLE CORONA DE PORCELANA PURA BS.4870 ."}', 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 2890.00, 1.00, '37/36/35/34', 4, 11560.00, 0.00, 11560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 2890.00, 1.00, '44/45/46/47', 4, 11560.00, 0.00, 11560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 920.00, 1.00, '33/43', 2, 1840.00, 0.00, 1840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 345, 1100.00, 1.00, NULL, 1, 1100.00, 0.00, 1100.00, false);

    -- Paciente 1707 | Fecha: 2015-12-29 | Total: 19200.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1707, 1, '2015-12-29', 19200.00, '{"A":"FASE 2"}', 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 3480.00, 1.00, '12/11/21/22', 4, 13920.00, 0.00, 13920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '41/42/31/32', 4, 3680.00, 0.00, 3680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 111, 1600.00, 1.00, NULL, 1, 1600.00, 0.00, 1600.00, false);

    -- Paciente 1712 | Fecha: 2015-12-30 | Total: 4840.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1712, 1, '2015-12-30', 4840.00, NULL, 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2550.00, 1.00, '12', 1, 2550.00, 0.00, 2550.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '12', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 220, 900.00, 1.00, '12', 1, 900.00, 0.00, 900.00, false);

    -- Paciente 2070 | Fecha: 2018-04-30 | Total: 11344.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2070, 1, '2018-04-30', 11344.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 37, 1280.00, 1.00, '12', 1, 1280.00, 20.00, 1024.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '12', 1, 7000.00, 20.00, 5600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '12', 1, 1750.00, 20.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4150.00, 1.00, '12', 1, 4150.00, 20.00, 3320.00, false);

    -- Paciente 147 | Fecha: 2015-12-04 | Total: 4440.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (147, 1, '2015-12-04', 4440.00, NULL, 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 580.00, 1.00, '24/25/26', 3, 1740.00, 0.00, 1740.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 220, 900.00, 1.00, '24/25/26', 3, 2700.00, 0.00, 2700.00, false);

    -- Paciente 147 | Fecha: 2018-05-08 | Total: 51600.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (147, 1, '2018-05-08', 51600.00, '{"A":"CIRUGIA DE IMPLANTES SERA REALIZADA POR EL DR. DARWIN JUSTINIANO, IMPLANTOLOGO.\r\nLA REHABILITACION SERA REALIZADA POR DR. ARTIEDA."}', 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 305, 7000.00, 1.00, '14/15/25/26', 4, 28000.00, 0.00, 28000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '14/15/25/26', 4, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4150.00, 1.00, '14/15/25/26', 4, 16600.00, 0.00, 16600.00, false);

    -- Paciente 720 | Fecha: 2018-05-14 | Total: 44360.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (720, 1, '2018-05-14', 44360.00, NULL, 7)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '13-11-21-22-23', 5, 3200.00, 0.00, 3200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '33-32-31-41-42-43', 6, 3840.00, 0.00, 3840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '15-24-25', 3, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '14-27-37-36-46', 5, 15900.00, 0.00, 15900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 35, 1400.00, 1.00, '18-28', 2, 2800.00, 0.00, 2800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '38-48', 2, 2020.00, 0.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2690.00, 1.00, '27', 1, 2690.00, 0.00, 2690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '27', 1, 1530.00, 0.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3950.00, 1.00, '17-26', 2, 7900.00, 0.00, 7900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '34-35-44-45', 4, 2560.00, 0.00, 2560.00, false);

    -- Paciente 720 | Fecha: 2023-01-06 | Total: 74160.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (720, 1, '2023-01-06', 74160.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 138, 2500.00, 1.00, NULL, 2, 5000.00, 0.00, 5000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 177, 5690.00, 1.00, '13-11-21-22-23', 5, 28450.00, 0.00, 28450.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 177, 5690.00, 1.00, '24-14', 2, 11380.00, 0.00, 11380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 311, 4000.00, 1.00, '12', 1, 4000.00, 0.00, 4000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 115, 3190.00, 1.00, '13-11-21-22-23', 5, 15950.00, 0.00, 15950.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 115, 3190.00, 1.00, '14-24', 2, 6380.00, 0.00, 6380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 301, 3000.00, 1.00, '12', 1, 3000.00, 0.00, 3000.00, false);

    -- Paciente 720 | Fecha: 2024-04-05 | Total: 13450.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (720, 1, '2024-04-05', 13450.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 24, 400.00, 1.00, '46', 1, 400.00, 0.00, 400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 310, 650.00, 1.00, '46', 1, 650.00, 0.00, 650.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1400.00, 1.00, '46', 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 311, 4000.00, 1.00, '46', 1, 4000.00, 0.00, 4000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '46', 1, 7000.00, 0.00, 7000.00, false);

    -- Paciente 808 | Fecha: 2015-12-29 | Total: 9860.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (808, 1, '2015-12-29', 9860.00, NULL, 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '33/32/31/41/42/43', 6, 3480.00, 0.00, 3480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '13/12/11/21/22/23', 6, 3480.00, 0.00, 3480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '45/37/47/28/18', 5, 2900.00, 0.00, 2900.00, false);

    -- Paciente 553 | Fecha: 2016-01-26 | Total: 42700.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (553, 1, '2016-01-26', 42700.00, '{"A":"PARA IMPLANTES REQUIERE EXAMEN TOMOGRAFICO. PRECIO UNITARIO DE IMPLANTE BS.8110, MUÑON SOBRE IMPLANTE BS. 2900 CORONA SOBRE IMPLANTE BS.4630. LA PRESENTE PROPUESTA CORRESPONDE A FASE A","B":"ELEMENTO DENTARIO 35 MANTENER HASTA QUE REQUIERA EXODONCIA."}', 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '16', 1, 2890.00, 0.00, 2890.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '25', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '25', 1, 4400.00, 0.00, 4400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 580.00, 1.00, '43/44/48', 3, 1740.00, 0.00, 1740.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 920.00, 1.00, '43/44', 2, 1840.00, 0.00, 1840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2440.00, 1.00, '48', 1, 2440.00, 0.00, 2440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 580.00, 1.00, '48', 1, 580.00, 0.00, 580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 221, 2760.00, 1.00, NULL, 1, 2760.00, 0.00, 2760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 2890.00, 1.00, '14', 1, 2890.00, 0.00, 2890.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 160, 2780.00, 1.00, '24', 1, 2780.00, 0.00, 2780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 158, 3010.00, 1.00, '26', 1, 3010.00, 0.00, 3010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1390.00, 1.00, '24/26', 2, 2780.00, 0.00, 2780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 4400.00, 1.00, '15/24/26', 3, 13200.00, 0.00, 13200.00, false);

    -- Paciente 5 | Fecha: 2013-11-06 | Total: 35416.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (5, 1, '2013-11-06', 35416.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 670.00, 1.00, '24', 1, 670.00, 20.00, 536.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 1600.00, 1.00, '23', 1, 1600.00, 20.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 1850.00, 1.00, '25', 1, 1850.00, 20.00, 1480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 2185.00, 1.00, '27', 1, 2185.00, 20.00, 1748.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1010.00, 1.00, '23-25-27', 3, 3030.00, 20.00, 2424.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3190.00, 1.00, '23-24-25-26-27', 5, 15950.00, 20.00, 12760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 159, 1850.00, 1.00, '25', 1, 1850.00, 20.00, 1480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 158, 2185.00, 1.00, '27', 1, 2185.00, 20.00, 1748.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1010.00, 1.00, '25-27', 2, 2020.00, 20.00, 1616.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3190.00, 1.00, '25-26-27', 3, 9570.00, 20.00, 7656.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 420.00, 1.00, '25-26-27', 3, 1260.00, 20.00, 1008.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 420.00, 1.00, '23-24-25-26-27', 5, 2100.00, 20.00, 1680.00, false);

    -- Paciente 436 | Fecha: 2013-11-20 | Total: 525.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (436, 1, '2013-11-20', 525.00, NULL, 7)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 84, 1050.00, 1.00, '13', 1, 1050.00, 50.00, 525.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 1850.00, 1.00, '13', 1, 1850.00, 100.00, 0.00, false);

    -- Paciente 436 | Fecha: 2014-03-18 | Total: 8712.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (436, 1, '2014-03-18', 8712.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2120.00, 1.00, '37', 1, 2120.00, 20.00, 1696.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1210.00, 1.00, '37', 1, 1210.00, 20.00, 968.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 195, 2520.00, 1.00, '37-35', 2, 5040.00, 20.00, 4032.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2520.00, 1.00, '34', 1, 2520.00, 20.00, 2016.00, false);

    -- Paciente 218 | Fecha: 2013-12-10 | Total: 7056.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (218, 1, '2013-12-10', 7056.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 215, 3780.00, 1.00, '14', 1, 3780.00, 30.00, 2646.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 82, 2520.00, 1.00, '21', 1, 2520.00, 30.00, 1764.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 215, 3780.00, 1.00, '21', 1, 3780.00, 30.00, 2646.00, false);

    -- Paciente 218 | Fecha: 2013-12-11 | Total: 14203.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (218, 1, '2013-12-11', 14203.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 670.00, 1.00, '14', 1, 670.00, 30.00, 469.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 82, 2520.00, 1.00, '14', 1, 2520.00, 30.00, 2520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 5880.00, 1.00, '14', 1, 5880.00, 30.00, 4116.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2100.00, 1.00, '14', 1, 2100.00, 30.00, 2100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 3360.00, 1.00, '14', 1, 3360.00, 30.00, 2352.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 215, 3780.00, 1.00, '14', 1, 3780.00, 30.00, 2646.00, false);

    -- Paciente 218 | Fecha: 2024-10-08 | Total: 32820.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (218, 1, '2024-10-08', 32820.00, '{"A":"PLAN FUNCIONAL POSTERIOR"}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '36-35-47-45', 4, 12720.00, 0.00, 12720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '34-44', 2, 2100.00, 0.00, 2100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 218, 7560.00, 1.00, '11', 1, 7560.00, 0.00, 7560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 1080.00, 1.00, '11', 1, 1080.00, 0.00, 1080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 241, 5640.00, 1.00, '11', 1, 5640.00, 0.00, 5640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 183, 1080.00, 1.00, '11', 1, 1080.00, 0.00, 1080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 2640.00, 1.00, NULL, 1, 2640.00, 0.00, 2640.00, false);

    -- Paciente 1209 | Fecha: 2013-12-26 | Total: 8705.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1209, 1, '2013-12-26', 8705.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 500.00, 1.00, NULL, 1, 500.00, 15.00, 425.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 2185.00, 1.00, '27', 1, 2185.00, 15.00, 1857.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 670.00, 1.00, '27', 1, 670.00, 15.00, 570.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 420.00, 1.00, '14-15', 2, 840.00, 15.00, 714.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 210, 420.00, 1.00, '26', 1, 420.00, 15.00, 357.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 161, 1765.00, 1.00, '26', 1, 1765.00, 15.00, 1500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 224, 670.00, 1.00, '26', 1, 670.00, 15.00, 570.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3190.00, 1.00, '26', 1, 3190.00, 15.00, 2712.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 283, 335.00, 1.00, '36', 1, 335.00, 100.00, 0.00, false);

    -- Paciente 300 | Fecha: 2013-05-20 | Total: 7640.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (300, 1, '2013-05-20', 7640.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 37, 840.00, 1.00, '15', 1, 840.00, 0.00, 840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 296, 500.00, 1.00, NULL, 1, 500.00, 0.00, 500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 214, 6300.00, 1.00, NULL, 1, 6300.00, 0.00, 6300.00, false);

    -- Paciente 300 | Fecha: 2013-06-12 | Total: 500.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (300, 1, '2013-06-12', 500.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 500.00, 1.00, NULL, 1, 500.00, 0.00, 500.00, false);

    -- Paciente 223 | Fecha: 2013-05-31 | Total: 15370.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (223, 1, '2013-05-31', 15370.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 202, 6720.00, 1.00, NULL, 1, 6720.00, 20.00, 5376.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 212, 5460.00, 1.00, NULL, 1, 5460.00, 20.00, 4368.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 202, 6720.00, 1.00, NULL, 1, 6720.00, 20.00, 5376.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 2, 250.00, 1.00, NULL, 1, 250.00, 0.00, 250.00, false);

    -- Paciente 1129 | Fecha: 2013-09-10 | Total: 70910.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1129, 1, '2013-09-10', 70910.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 1765.00, 1.00, '16', 1, 1765.00, 0.00, 1765.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 1600.00, 1.00, '12-13', 2, 3200.00, 0.00, 3200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1010.00, 1.00, '12-13-16', 3, 3030.00, 0.00, 3030.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3190.00, 1.00, '12-13-14-16', 4, 12760.00, 0.00, 12760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3190.00, 1.00, '16', 1, 3190.00, 0.00, 3190.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1010.00, 1.00, '12-13-16', 3, 3030.00, 0.00, 3030.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 161, 1765.00, 1.00, '16', 1, 1765.00, 0.00, 1765.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 162, 1600.00, 1.00, '12-13', 2, 3200.00, 0.00, 3200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 384, 3530.00, 1.00, '12-13', 2, 7060.00, 0.00, 7060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 3360.00, 1.00, '14', 1, 3360.00, 0.00, 3360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 2100.00, 1.00, '14', 1, 2100.00, 0.00, 2100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 5880.00, 1.00, '14', 1, 5880.00, 0.00, 5880.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 177, 2520.00, 1.00, '11', 1, 2520.00, 0.00, 2520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 185, 3190.00, 1.00, '24-25', 2, 6380.00, 0.00, 6380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 201, 1010.00, 1.00, '25', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 162, 1600.00, 1.00, '25', 1, 1600.00, 0.00, 1600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 177, 2520.00, 1.00, '21-22-23', 3, 7560.00, 0.00, 7560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 500.00, 1.00, NULL, 1, 500.00, 0.00, 500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 79, 500.00, 1.00, NULL, 1, 500.00, 0.00, 500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 79, 500.00, 1.00, NULL, 1, 500.00, 0.00, 500.00, false);

    -- Paciente 1129 | Fecha: 2013-09-10 | Total: 52425.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1129, 1, '2013-09-10', 52425.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 3360.00, 1.00, '35-36-37', 3, 10080.00, 0.00, 10080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2100.00, 1.00, '35-36-37', 3, 6300.00, 0.00, 6300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 5880.00, 1.00, '35-36-37', 3, 17640.00, 0.00, 17640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 383, 1680.00, 1.00, '46', 1, 1680.00, 0.00, 1680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3190.00, 1.00, '44-47', 2, 6380.00, 0.00, 6380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1010.00, 1.00, '44-47', 2, 2020.00, 0.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 158, 2185.00, 1.00, '47', 1, 2185.00, 0.00, 2185.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 162, 1600.00, 1.00, '44', 1, 1600.00, 0.00, 1600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 183, 420.00, 1.00, '44-46-47', 3, 1260.00, 0.00, 1260.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 201, 1010.00, 1.00, '44-47', 2, 2020.00, 0.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 203, 1260.00, 1.00, NULL, 1, 1260.00, 0.00, 1260.00, false);

    -- Paciente 1106 | Fecha: 2013-09-18 | Total: 166300.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1106, 1, '2013-09-18', 166300.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2100.00, 1.00, '15-27-44-45', 4, 8400.00, 0.00, 8400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 1600.00, 1.00, '13-11', 2, 3200.00, 0.00, 3200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1010.00, 1.00, '13-11', 2, 2020.00, 0.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3190.00, 1.00, '13-12-11-21-22-23', 6, 19140.00, 0.00, 19140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3190.00, 1.00, '24-25', 2, 6380.00, 0.00, 6380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 420.00, 1.00, '33-32-32-41-42-43', 6, 2520.00, 0.00, 2520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 212, 5460.00, 1.00, NULL, 1, 5460.00, 0.00, 5460.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 5880.00, 1.00, '14', 1, 5880.00, 0.00, 5880.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2100.00, 1.00, '14', 1, 2100.00, 0.00, 2100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 3360.00, 1.00, '14', 1, 3360.00, 0.00, 3360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 2100.00, 1.00, '15-27-44', 3, 6300.00, 0.00, 6300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 162, 1600.00, 1.00, '13-11', 2, 3200.00, 0.00, 3200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1010.00, 1.00, '13-11', 2, 2020.00, 0.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3190.00, 1.00, '13-12-11-21-22-23', 6, 19140.00, 0.00, 19140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3190.00, 1.00, '24', 1, 3190.00, 0.00, 3190.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 420.00, 1.00, '33-32-31-41-42-43', 6, 2520.00, 0.00, 2520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 212, 5460.00, 1.00, NULL, 2, 10920.00, 0.00, 10920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 79, 500.00, 1.00, NULL, 1, 500.00, 0.00, 500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 197, 2100.00, 1.00, '15-27-44-45', 4, 8400.00, 0.00, 8400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 162, 1600.00, 1.00, '15-13-11', 3, 4800.00, 0.00, 4800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 201, 1010.00, 1.00, '15-13-11', 3, 3030.00, 0.00, 3030.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 185, 3190.00, 1.00, '15-14-13-12-11-21', 6, 19140.00, 0.00, 19140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 185, 3190.00, 1.00, '22-23-24-25', 4, 12760.00, 0.00, 12760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 116, 420.00, 1.00, '33-32-31-41-42-43', 6, 2520.00, 0.00, 2520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 212, 5460.00, 1.00, NULL, 1, 5460.00, 0.00, 5460.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 79, 500.00, 1.00, NULL, 1, 500.00, 0.00, 500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 500.00, 1.00, NULL, 1, 500.00, 0.00, 500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 183, 420.00, 1.00, '13/12/11/21/22/23', 6, 2520.00, 0.00, 2520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 183, 420.00, 1.00, '24', 1, 420.00, 0.00, 420.00, false);

    -- Paciente 1185 | Fecha: 2014-01-17 | Total: 28400.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1185, 1, '2014-01-17', 28400.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 1850.00, 1.00, '33', 1, 1850.00, 0.00, 1850.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 86, 420.00, 1.00, '33', 1, 420.00, 0.00, 420.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1010.00, 1.00, '33-43-47', 3, 3030.00, 0.00, 3030.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 180, 1260.00, 1.00, '33', 1, 1260.00, 0.00, 1260.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 2100.00, 1.00, '32-31-41-42', 4, 8400.00, 0.00, 8400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 1600.00, 1.00, '43', 1, 1600.00, 0.00, 1600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3190.00, 1.00, '43-47', 2, 6380.00, 0.00, 6380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 212, 5460.00, 1.00, NULL, 1, 5460.00, 0.00, 5460.00, false);

    -- Paciente 1185 | Fecha: 2014-01-17 | Total: 91975.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1185, 1, '2014-01-17', 91975.00, '{"A":"-","C":"MAXILAR SUPERIOR\r\nTRATAMIENTO A CORTO PLAZO"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 227, 2000.00, 1.00, NULL, 1, 2000.00, 0.00, 2000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 382, 7360.00, 1.00, NULL, 1, 7360.00, 0.00, 7360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 295, 3000.00, 1.00, NULL, 1, 3000.00, 0.00, 3000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2100.00, 1.00, '11-14-21-24', 4, 8400.00, 0.00, 8400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 670.00, 1.00, '26-21-11-13', 4, 2680.00, 0.00, 2680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 82, 2520.00, 1.00, '26-21-13-11', 2, 5040.00, 0.00, 5040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 5880.00, 1.00, '11-14-21-24', 4, 23520.00, 0.00, 23520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 202, 6720.00, 1.00, NULL, 1, 6720.00, 0.00, 6720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 180, 1260.00, 1.00, '11-13-21-26', 4, 5040.00, 0.00, 5040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1010.00, 1.00, '11-13-21-26', 4, 4040.00, 0.00, 4040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 86, 420.00, 1.00, '11-13-21-26', 1, 420.00, 0.00, 420.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 159, 1850.00, 1.00, '13-11-21', 3, 5550.00, 0.00, 5550.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 161, 1765.00, 1.00, '26', 1, 1765.00, 0.00, 1765.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 202, 6720.00, 1.00, NULL, 1, 6720.00, 0.00, 6720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 227, 2000.00, 1.00, NULL, 1, 2000.00, 0.00, 2000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 82, 2520.00, 1.00, '13-11-21-26', 2, 5040.00, 0.00, 5040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 34, 670.00, 1.00, '13-11-21-26', 4, 2680.00, 0.00, 2680.00, false);

    -- Paciente 2350 | Fecha: 2019-06-27 | Total: 221360.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2350, 1, '2019-06-27', 221360.00, '{"A":"FAVOR LEER INFORME DENTAL ADJUNTO","B":"EXISTE LA POSIBILIDAD DE COLOCAR RELLENO OSEO EN AREA DE EXTRACCIONES 25/26/27/28.\r\nRELLENO OSEO POR DIENTE BS. 3830.-, SE REALIZARA EL COBRO UNICAMENTE DE 2 UNIDADES.","C":"FAVOR LEER INFORME DENTAL ADJUNTO"}', 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '17/14/15/23/24/25', 6, 6060.00, 0.00, 6060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '26/27/28', 3, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '22/23/24/14/15/16', 6, 42000.00, 0.00, 42000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '22/23/24/14/15/16', 6, 10500.00, 0.00, 10500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 323, 14000.00, 1.00, NULL, 2, 28000.00, 0.00, 28000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 239, 2550.00, 1.00, NULL, 1, 2550.00, 0.00, 2550.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '17/25/26/27/28', 5, 5050.00, 0.00, 5050.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '22/16', 2, 14000.00, 0.00, 14000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 4150.00, 1.00, '16/22', 2, 8300.00, 0.00, 8300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1750.00, 1.00, '16/22', 2, 3500.00, 0.00, 3500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 221, 2500.00, 1.00, NULL, 1, 2500.00, 0.00, 2500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 313, 1920.00, 1.00, '25/26/27', 1, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 313, 1920.00, 1.00, '16/17', 1, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 221, 2500.00, 1.00, NULL, 1, 2500.00, 0.00, 2500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 34, 1010.00, 1.00, '17/25/26/27/28', 5, 5050.00, 0.00, 5050.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 292, 7000.00, 1.00, '16/17/22/25/26/27', 6, 42000.00, 0.00, 42000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 293, 1750.00, 1.00, '16/17/22/25/26/27', 6, 10500.00, 0.00, 10500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 294, 4150.00, 1.00, '16/17/22/25/26/27', 6, 24900.00, 0.00, 24900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 93, 4550.00, 1.00, NULL, 2, 9100.00, 0.00, 9100.00, false);

    -- Paciente 1517 | Fecha: 2015-02-03 | Total: 21775.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1517, 1, '2015-02-03', 21775.00, NULL, 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 9, 205.00, 1.00, '36', 1, 205.00, 0.00, 205.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 505.00, 1.00, '36', 1, 505.00, 0.00, 505.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 505.00, 1.00, '36', 1, 505.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 2620.00, 1.00, '36', 1, 2620.00, 0.00, 2620.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3830.00, 1.00, '36', 1, 3830.00, 0.00, 3830.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 9, 205.00, 1.00, '36', 1, 205.00, 0.00, 205.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 805.00, 1.00, '36', 1, 805.00, 0.00, 805.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7055.00, 1.00, '36', 1, 7055.00, 0.00, 7055.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 2520.00, 1.00, '36', 1, 2520.00, 0.00, 2520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 4030.00, 1.00, '36', 1, 4030.00, 0.00, 4030.00, false);

    -- Paciente 1510 | Fecha: 2015-02-06 | Total: 6844.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1510, 1, '2015-02-06', 6844.00, NULL, 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 36, 1614.00, 1.00, '38/48', 2, 3228.00, 20.00, 2582.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 36, 1614.00, 1.00, '38/48', 2, 3228.00, 20.00, 2582.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 347, 1680.00, 1.00, '38/48', 1, 1680.00, 0.00, 1680.00, false);

    -- Paciente 1510 | Fecha: 2015-02-06 | Total: 4262.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1510, 1, '2015-02-06', 4262.00, NULL, 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 36, 1614.00, 1.00, '38/48', 2, 3228.00, 20.00, 2582.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 347, 1680.00, 1.00, '38/48', 1, 1680.00, 0.00, 1680.00, false);

    -- Paciente 51 | Fecha: 2015-02-18 | Total: 2780.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (51, 1, '2015-02-18', 2780.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 111, 1390.00, 1.00, NULL, 2, 2780.00, 0.00, 2780.00, false);

    -- Paciente 51 | Fecha: 2025-11-21 | Total: 2280.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (51, 1, '2025-11-21', 2280.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 147, 2280.00, 1.00, '33/32/31/41/42/43', 1, 2280.00, 0.00, 2280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 446 | Fecha: 2015-02-24 | Total: 7655.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (446, 1, '2015-02-24', 7655.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 35, 1110.00, 1.00, '18', 1, 1110.00, 0.00, 1110.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 805.00, 1.00, '16/17/27/36/37', 5, 4025.00, 0.00, 4025.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2520.00, 1.00, '26', 1, 2520.00, 0.00, 2520.00, false);

    -- Paciente 811 | Fecha: 2015-02-24 | Total: 7257.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (811, 1, '2015-02-24', 7257.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2520.00, 1.00, '47-27', 2, 5040.00, 50.00, 2520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2120.00, 1.00, '27', 1, 2120.00, 50.00, 1060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 805.00, 1.00, '48', 1, 805.00, 50.00, 402.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 212, 6550.00, 1.00, NULL, 1, 6550.00, 50.00, 3275.00, false);

    -- Paciente 253 | Fecha: 2015-02-24 | Total: 23790.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (253, 1, '2015-02-24', 23790.00, '{"B":"EXISTE LA POSIBILIDAD DE REALIZAR TRATAMIENTO DE CONDUCTOS UNIRADICULARES EN LOS ELEMENTOS DENTARIOS 11/12/21/22. PRECIO POR UNIDAD 1920 BS."}', 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 3025.00, 1.00, '12/11/21/22', 4, 12100.00, 0.00, 12100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 117, 805.00, 1.00, '11/12', 2, 1610.00, 0.00, 1610.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 2520.00, 1.00, '12/11/21/22', 4, 10080.00, 0.00, 10080.00, false);

    -- Paciente 253 | Fecha: 2015-02-24 | Total: 17135.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (253, 1, '2015-02-24', 17135.00, '{"B":"EXISTE LA POSIBILIDAD DE REALIZAR TRATAMIENTO DE CONDUSCTOS UNIRADUCULAR EN LOS ELEMENTOS DENTARIOS 11/12/21/22. PRECIO POR UNIDAD: 1920 BS."}', 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 117, 805.00, 1.00, '11/12', 2, 1610.00, 0.00, 1610.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1210.00, 1.00, '13', 1, 1210.00, 0.00, 1210.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 384, 4235.00, 1.00, '13', 1, 4235.00, 0.00, 4235.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 2520.00, 1.00, '12/11/21/22', 4, 10080.00, 0.00, 10080.00, false);

    -- Paciente 1528 | Fecha: 2015-02-24 | Total: 5845.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1528, 1, '2015-02-24', 5845.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1210.00, 1.00, '26', 1, 1210.00, 0.00, 1210.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3830.00, 1.00, '26', 1, 3830.00, 0.00, 3830.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 805.00, 1.00, '42', 1, 805.00, 0.00, 805.00, false);

    -- Paciente 523 | Fecha: 2015-02-26 | Total: 6350.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (523, 1, '2015-02-26', 6350.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 805.00, 1.00, '35', 1, 805.00, 0.00, 805.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 211, 3025.00, 1.00, '36', 1, 3025.00, 0.00, 3025.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2520.00, 1.00, '35', 1, 2520.00, 0.00, 2520.00, false);

    -- Paciente 1448 | Fecha: 2014-11-14 | Total: 30959.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1448, 1, '2014-11-14', 30959.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 505.00, 1.00, '37/46', 2, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1210.00, 1.00, '37/46', 2, 2420.00, 0.00, 2420.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2120.00, 1.00, '37/46/47', 3, 6360.00, 0.00, 6360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2520.00, 1.00, '45/47', 2, 5040.00, 0.00, 5040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2520.00, 1.00, '16/27', 2, 5040.00, 0.00, 5040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 805.00, 1.00, '36', 1, 805.00, 0.00, 805.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 505.00, 1.00, '26', 1, 505.00, 0.00, 505.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 505.00, 1.00, '26', 1, 505.00, 0.00, 505.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3830.00, 1.00, '37/46', 2, 7660.00, 0.00, 7660.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 36, 1614.00, 1.00, '38', 1, 1614.00, 0.00, 1614.00, false);

    -- Paciente 123 | Fecha: 2015-02-27 | Total: 5745.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (123, 1, '2015-02-27', 5745.00, NULL, 7)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3830.00, 1.00, '36-37', 2, 7660.00, 25.00, 5745.00, false);

    -- Paciente 1523 | Fecha: 2015-02-27 | Total: 48220.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1523, 1, '2015-02-27', 48220.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 2620.00, 1.00, '17/16', 2, 5240.00, 0.00, 5240.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 165, 690.00, 1.00, '36/37', 2, 1380.00, 0.00, 1380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 580.00, 1.00, '16', 1, 580.00, 0.00, 580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '16', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 580.00, 1.00, '16/26/35/45', 4, 2320.00, 0.00, 2320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 580.00, 1.00, '33/32/42/43/11', 5, 2900.00, 0.00, 2900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 925.00, 1.00, '14/34', 2, 1850.00, 0.00, 1850.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1390.00, 1.00, '15/35', 2, 2780.00, 0.00, 2780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 210, 580.00, 1.00, '35', 1, 580.00, 0.00, 580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 116, 580.00, 1.00, '13/12/22/21', 4, 2320.00, 0.00, 2320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 197, 2895.00, 1.00, '27/36/37/47', 4, 11580.00, 0.00, 11580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 159, 2550.00, 1.00, '45', 1, 2550.00, 0.00, 2550.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 201, 1390.00, 1.00, '45', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 185, 4405.00, 1.00, '16/15', 2, 8810.00, 0.00, 8810.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 159, 2550.00, 1.00, '35', 1, 2550.00, 0.00, 2550.00, false);

    -- Paciente 393 | Fecha: 2015-03-06 | Total: 52650.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (393, 1, '2015-03-06', 52650.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4405.00, 1.00, '13/16', 2, 8810.00, 0.00, 8810.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4405.00, 1.00, '23/24/25/26', 4, 17620.00, 0.00, 17620.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 2210.00, 1.00, '13/23', 2, 4420.00, 0.00, 4420.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2440.00, 1.00, '16/26', 2, 4880.00, 0.00, 4880.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 925.00, 1.00, '11/21', 2, 1850.00, 0.00, 1850.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2900.00, 1.00, '14/15', 2, 5800.00, 0.00, 5800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4635.00, 1.00, '14/15', 2, 9270.00, 0.00, 9270.00, false);

    -- Paciente 908 | Fecha: 2015-03-09 | Total: 8235.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (908, 1, '2015-03-09', 8235.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2440.00, 1.00, '36', 1, 2440.00, 0.00, 2440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '36', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4405.00, 1.00, '36', 1, 4405.00, 0.00, 4405.00, false);

    -- Paciente 908 | Fecha: 2022-04-04 | Total: 4420.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (908, 1, '2022-04-04', 4420.00, '{"A":"SE RECOMIENDA LIMPIEZA Y CONTROL CADA 6 MESES. \r\nMATERIAL REALIZADO EN LABORATORIO, MAYOR DURACION Y MEJOR AJUSTE","B":"SE RECOMIENDA LIMPIEZA Y CONTROL CADA 6 MESES. MATERIAL EL CUAL SE VA DESGASTANDO, PIGMENTANDO Y ES NECESARIO MUY BUENA HIGIENE PARA EVITAR FILTRACIONES"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '47', 1, 3180.00, 0.00, 3180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 121, 1240.00, 1.00, '47', 1, 1240.00, 0.00, 1240.00, false);

    -- Paciente 908 | Fecha: 2022-12-20 | Total: 47440.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (908, 1, '2022-12-20', 47440.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 209, 3040.00, 1.00, NULL, 1, 3040.00, 0.00, 3040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 214, 11400.00, 1.00, NULL, 2, 22800.00, 0.00, 22800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 202, 10200.00, 1.00, NULL, 1, 10200.00, 0.00, 10200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 214, 11400.00, 1.00, NULL, 1, 11400.00, 0.00, 11400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 1348 | Fecha: 2015-03-11 | Total: 332295.50
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1348, 1, '2015-03-11', 332295.50, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 580.00, 1.00, '21/11/12/17', 4, 2320.00, 0.00, 2320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2550.00, 1.00, '12/11/21', 3, 7650.00, 0.00, 7650.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '11/12/21/23', 4, 5560.00, 0.00, 5560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 200, 770.00, 1.00, '17/26', 2, 1540.00, 0.00, 1540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 580.00, 1.00, '17/16/15', 3, 1740.00, 0.00, 1740.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 580.00, 1.00, '13/12/11/21/22/23', 6, 3480.00, 0.00, 3480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '17-16-15-13-12-11', 6, 26400.00, 0.00, 26400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '21-22-23-26', 4, 17600.00, 0.00, 17600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 920.00, 1.00, '26', 1, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '27', 1, 2890.00, 0.00, 2890.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '23/12/', 2, 2780.00, 0.00, 2780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2550.00, 1.00, '12', 1, 2550.00, 0.00, 2550.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 86, 580.00, 1.00, '12', 1, 580.00, 0.00, 580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '11/12/13/14/16/15', 6, 26400.00, 0.00, 26400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '17/21/22/23/', 4, 17600.00, 0.00, 17600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 920.00, 1.00, '17', 1, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1390.00, 1.00, '23/12/26', 3, 4170.00, 0.00, 4170.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 224, 920.00, 1.00, '17', 1, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 4400.00, 1.00, '23/22/21/11/12/17', 6, 26400.00, 0.00, 26400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 4400.00, 1.00, '26', 1, 4400.00, 0.00, 4400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 212, 7530.00, 1.00, NULL, 1, 7530.00, 0.00, 7530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 201, 1390.00, 1.00, '23', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 34, 920.00, 1.00, '12', 1, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 292, 8110.00, 1.00, '12/13/14/15/16', 5, 40550.00, 0.00, 40550.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 293, 2900.00, 1.00, '12/13/14/15/16', 5, 14500.00, 0.00, 14500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 294, 4630.00, 1.00, '12/13/14/15/16', 5, 23150.00, 0.00, 23150.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 185, 4400.00, 1.00, '11/17/23/22/21', 5, 22000.00, 0.00, 22000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 201, 1390.00, 1.00, '23', 1, 1390.00, 15.00, 1181.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 34, 920.00, 1.00, '12', 1, 920.00, 15.00, 782.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 292, 8110.00, 1.00, '12/14/16', 3, 24330.00, 15.00, 20680.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 293, 2900.00, 1.00, '12/14/16', 3, 8700.00, 15.00, 7395.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 294, 4630.00, 1.00, '12/14/16', 3, 13890.00, 15.00, 11806.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 185, 4400.00, 1.00, '13/17/21/22/23', 5, 22000.00, 15.00, 18700.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 243, 700.00, 1.00, '21/22/23/11/12/13', 6, 4200.00, 50.00, 2100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 243, 700.00, 1.00, '24/26/27', 3, 2100.00, 50.00, 1050.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 82, 3480.00, 1.00, '12', 1, 3480.00, 50.00, 1740.00, false);

    -- Paciente 244 | Fecha: 2015-03-13 | Total: 5330.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (244, 1, '2015-03-13', 5330.00, NULL, 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 925.00, 1.00, '16', 1, 925.00, 0.00, 925.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 195, 2900.00, 1.00, '16', 1, 2900.00, 0.00, 2900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 224, 925.00, 1.00, '16', 1, 925.00, 0.00, 925.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 580.00, 1.00, '16', 1, 580.00, 0.00, 580.00, false);

    -- Paciente 244 | Fecha: 2022-08-15 | Total: 9540.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (244, 1, '2022-08-15', 9540.00, '{"A":"EXISTE LA POSIBILIDAD DE REALIZAR TRATAMIENTO DE ENDODONCIA POR LA CERCANIA AL NERVIO"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '45-46-47', 3, 9540.00, 0.00, 9540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 308 | Fecha: 2015-03-13 | Total: 58650.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (308, 1, '2015-03-13', 58650.00, NULL, 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4405.00, 1.00, '16', 1, 4405.00, 0.00, 4405.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 212, 7535.00, 1.00, NULL, 1, 7535.00, 0.00, 7535.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 4405.00, 1.00, '16', 1, 4405.00, 0.00, 4405.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 211, 3480.00, 1.00, '15/17', 1, 3480.00, 0.00, 3480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 215, 5215.00, 1.00, '24/25', 1, 5215.00, 0.00, 5215.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 292, 8110.00, 1.00, '24/25', 2, 16220.00, 0.00, 16220.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 81, 1160.00, 1.00, '32/33', 1, 1160.00, 0.00, 1160.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 81, 1160.00, 1.00, '33/32', 1, 1160.00, 0.00, 1160.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 293, 2900.00, 1.00, '24/25', 2, 5800.00, 0.00, 5800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 294, 4635.00, 1.00, '24/25', 2, 9270.00, 0.00, 9270.00, false);

    -- Paciente 308 | Fecha: 2017-10-25 | Total: 64530.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (308, 1, '2017-10-25', 64530.00, NULL, 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 180, 1900.00, 1.00, '21/22/11/12/13/16', 6, 11400.00, 0.00, 11400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 202, 10200.00, 1.00, NULL, 1, 10200.00, 0.00, 10200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '21/22/11/12/13/16', 6, 6060.00, 0.00, 6060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 202, 10200.00, 1.00, NULL, 1, 10200.00, 0.00, 10200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 34, 1010.00, 1.00, '27/23/22', 3, 3030.00, 0.00, 3030.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 210, 640.00, 1.00, '11/12/13/21', 4, 2560.00, 0.00, 2560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 210, 640.00, 1.00, '22/23/16', 3, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 202, 10200.00, 1.00, NULL, 1, 10200.00, 0.00, 10200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 210, 640.00, 1.00, '11/12/13/21', 4, 2560.00, 0.00, 2560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 210, 640.00, 1.00, '22/23/16', 3, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 640.00, 1.00, '11/12/13/16', 4, 2560.00, 0.00, 2560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 640.00, 1.00, '22/21/23', 3, 1920.00, 0.00, 1920.00, false);

    -- Paciente 308 | Fecha: 2025-05-13 | Total: 29310.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (308, 1, '2025-05-13', 29310.00, NULL, 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1110.00, 1.00, '23', 1, 1110.00, 0.00, 1110.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 214, 12540.00, 1.00, NULL, 1, 12540.00, 0.00, 12540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1110.00, 1.00, '23/11/12/13', 4, 4440.00, 0.00, 4440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 202, 11220.00, 1.00, NULL, 1, 11220.00, 0.00, 11220.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 308 | Fecha: 2026-01-28 | Total: 12000.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (308, 1, '2026-01-28', 12000.00, '{"A":"-SE DEBE TOMAR RADIOGRAFIA PANORAMICA PREVIA A EXTRACCIONES DENTALES\r\n-SE EVALUARA EXTRACCION DE ELEMENTO DENTAL 16\r\n-PROTESIS TOTAL SUPERIOR DEFINITIVA BS 16000"}', 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1600.00, 1.00, '13/12/11/21/22', 5, 8000.00, 0.00, 8000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 239, 4000.00, 1.00, NULL, 1, 4000.00, 0.00, 4000.00, false);

    -- Paciente 1482 | Fecha: 2015-03-31 | Total: 8230.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1482, 1, '2015-03-31', 8230.00, NULL, 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2440.00, 1.00, '37', 1, 2440.00, 0.00, 2440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '37', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '37', 1, 4400.00, 0.00, 4400.00, false);

    -- Paciente 1522 | Fecha: 2015-03-18 | Total: 246131.20
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1522, 1, '2015-03-18', 246131.20, NULL, 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2440.00, 1.00, '16/26', 2, 4880.00, 18.00, 4001.60, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 2210.00, 1.00, '15/32/33/41/42/43', 6, 13260.00, 18.00, 10873.20, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '15/16/26', 3, 4170.00, 18.00, 3419.40, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4405.00, 1.00, '15/16/26', 3, 13215.00, 18.00, 10836.30, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 925.00, 1.00, '22/27', 2, 1850.00, 18.00, 1517.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 8110.00, 1.00, '11/13/14/23/24/25', 6, 48660.00, 18.00, 39901.20, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2900.00, 1.00, '11/13/14/23/24/25', 6, 17400.00, 18.00, 14268.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4635.00, 1.00, '11/13/14/23/24/25', 6, 27810.00, 18.00, 22804.20, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4405.00, 1.00, '12/21/22', 3, 13215.00, 18.00, 10836.30, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '32/33/41/42/43', 5, 6950.00, 18.00, 5699.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4405.00, 1.00, '31/32/33/41/42/43', 6, 26430.00, 18.00, 21672.60, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 229, 1930.00, 1.00, '11/12/13/14/15/16', 6, 11580.00, 18.00, 9495.60, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 229, 1930.00, 1.00, '21/22/23/24/25/26', 6, 11580.00, 18.00, 9495.60, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 580.00, 1.00, '31/32/33/41/42/43', 6, 3480.00, 18.00, 2853.60, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 212, 7535.00, 1.00, NULL, 1, 7535.00, 18.00, 6178.70, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 81, 1160.00, 1.00, '31/32/33/41/42/43', 1, 1160.00, 18.00, 951.20, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 161, 2440.00, 1.00, '16/26', 2, 4880.00, 18.00, 4001.60, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 162, 2210.00, 1.00, '15/32/33/41/42/43', 6, 13260.00, 18.00, 10873.20, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1390.00, 1.00, '15/16/26', 3, 4170.00, 18.00, 3419.40, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1390.00, 1.00, '32/33/41/42/43', 5, 6950.00, 18.00, 5699.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 4405.00, 1.00, '15/16/26', 3, 13215.00, 18.00, 10836.30, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 4405.00, 1.00, '31/32/33/41/42/43', 6, 26430.00, 18.00, 21672.60, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 925.00, 1.00, '22/27', 2, 1850.00, 18.00, 1517.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 212, 7535.00, 1.00, NULL, 2, 15070.00, 18.00, 12357.40, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 81, 1160.00, 1.00, '31/32/33/41/42/43', 1, 1160.00, 18.00, 951.20, false);

    -- Paciente 302 | Fecha: 2014-02-12 | Total: 56257.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (302, 1, '2014-02-12', 56257.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2100.00, 1.00, '11/14/15', 3, 6300.00, 40.00, 3780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2100.00, 1.00, '21/24/25/26', 4, 8400.00, 40.00, 5040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 295, 3000.00, 1.00, NULL, 1, 3000.00, 0.00, 3000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 382, 7360.00, 1.00, NULL, 1, 7360.00, 25.00, 5520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 2100.00, 1.00, '11/14/15', 3, 6300.00, 40.00, 3780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 2100.00, 1.00, '21/24/25/26', 4, 8400.00, 40.00, 5040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 219, 350.00, 1.00, '11/12/13/14/15', 5, 1750.00, 25.00, 1312.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 219, 350.00, 1.00, '21/22/23/24/25/26', 6, 2100.00, 25.00, 1575.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 3360.00, 1.00, '11/14/15', 3, 10080.00, 25.00, 7560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 3360.00, 1.00, '21/24/25/26', 4, 13440.00, 25.00, 10080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3190.00, 1.00, '12/13/22/23', 4, 12760.00, 25.00, 9570.00, false);

    -- Paciente 302 | Fecha: 2021-01-15 | Total: 2920.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (302, 1, '2021-01-15', 2920.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 209, 2280.00, 1.00, NULL, 1, 2280.00, 0.00, 2280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 234, 640.00, 1.00, NULL, 1, 640.00, 0.00, 640.00, false);

    -- Paciente 1040 | Fecha: 2014-02-26 | Total: 2745.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1040, 1, '2014-02-26', 2745.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 36, 1345.00, 1.00, '48', 1, 1345.00, 0.00, 1345.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 347, 1400.00, 1.00, NULL, 1, 1400.00, 0.00, 1400.00, false);

    -- Paciente 1300 | Fecha: 2014-04-07 | Total: 75188.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1300, 1, '2014-04-07', 75188.00, '{"B":"PIEZAS 34 Y 45 CON AUSENCIA DE TRATAMIENTO DE CONDUCTOS Y CON PERNO METALICO","C":"PIEZAS 34 Y 45 CON AUSENCIA DE TRATAMIENTO DE CONDUCTOS Y CON PERNO METALICO"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3830.00, 1.00, '34-33-32-31', 4, 15320.00, 0.00, 15320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3830.00, 1.00, '41/43/44/45', 4, 15320.00, 15.00, 13022.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 212, 6550.00, 1.00, NULL, 1, 6550.00, 15.00, 5568.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 195, 2520.00, 1.00, '34-33-32-31', 4, 10080.00, 0.00, 10080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 195, 2520.00, 1.00, '41-43-44-45', 4, 10080.00, 0.00, 10080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 212, 6550.00, 1.00, NULL, 1, 6550.00, 15.00, 5568.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 163, 2015.00, 1.00, '34-44', 2, 4030.00, 0.00, 4030.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 162, 1920.00, 1.00, '31-32-33-41-43-45', 6, 11520.00, 0.00, 11520.00, false);

    -- Paciente 1090 | Fecha: 2014-05-15 | Total: 7801.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1090, 1, '2014-05-15', 7801.00, NULL, 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 505.00, 1.00, '14/15', 2, 1010.00, 30.00, 707.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1210.00, 1.00, '14/15', 2, 2420.00, 30.00, 1694.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3830.00, 1.00, '14/15/16', 3, 11490.00, 53.00, 5400.00, false);

    -- Paciente 1090 | Fecha: 2023-01-13 | Total: 19344.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1090, 1, '2023-01-13', 19344.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '35/36', 2, 14000.00, 22.00, 10920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1400.00, 1.00, '35/36', 2, 2800.00, 22.00, 2184.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 311, 4000.00, 1.00, '35/36', 2, 8000.00, 22.00, 6240.00, false);

    -- Paciente 910 | Fecha: 2014-06-10 | Total: 132940.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (910, 1, '2014-06-10', 132940.00, NULL, 7)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 805.00, 1.00, '16', 1, 805.00, 20.00, 644.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 82, 3025.00, 1.00, '16', 1, 3025.00, 20.00, 2420.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 84, 1260.00, 1.00, '16-13-11-21-23-24', 6, 7560.00, 20.00, 6048.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 84, 1260.00, 1.00, '27', 1, 1260.00, 20.00, 1008.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2220.00, 1.00, '13-11-21', 3, 6660.00, 20.00, 5328.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1210.00, 1.00, '13-11-21-24', 4, 4840.00, 20.00, 3872.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 805.00, 1.00, '27', 1, 805.00, 20.00, 644.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3830.00, 1.00, '13-12-11-21-22-23', 6, 22980.00, 20.00, 18384.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3830.00, 1.00, '24', 1, 3830.00, 20.00, 3064.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 505.00, 1.00, '13-12-11-21-22-23', 6, 3030.00, 20.00, 2424.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 505.00, 1.00, '27', 1, 505.00, 20.00, 404.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7055.00, 1.00, '14-14-25-26', 4, 28220.00, 20.00, 22576.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2520.00, 1.00, '14-15-25-26', 4, 10080.00, 20.00, 8064.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4030.00, 1.00, '14-15-25-26', 4, 16120.00, 20.00, 12896.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 159, 2220.00, 1.00, '43-35', 2, 4440.00, 20.00, 3552.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1210.00, 1.00, '42-43-35', 3, 3630.00, 20.00, 2904.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3830.00, 1.00, '35-42-43-45', 4, 15320.00, 20.00, 12256.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7055.00, 1.00, '36-46', 2, 14110.00, 20.00, 11288.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 2520.00, 1.00, '36-46', 2, 5040.00, 20.00, 4032.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 4030.00, 1.00, '36-46', 2, 8060.00, 20.00, 6448.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 505.00, 1.00, '32-31-41-45', 4, 2020.00, 20.00, 1616.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 505.00, 1.00, '35-42-43-45-48', 5, 2525.00, 20.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 210, 505.00, 1.00, '35', 1, 505.00, 20.00, 404.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 805.00, 1.00, '44', 1, 805.00, 20.00, 644.00, false);

    -- Paciente 910 | Fecha: 2019-10-24 | Total: 41960.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (910, 1, '2019-10-24', 41960.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '45/34/35', 3, 5250.00, 0.00, 5250.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4150.00, 1.00, '45/34/35', 3, 12450.00, 0.00, 12450.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '34/35/45', 3, 21000.00, 0.00, 21000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 38, 760.00, 1.00, '45', 1, 760.00, 0.00, 760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 386, 2500.00, 1.00, '45/34/35', 1, 2500.00, 0.00, 2500.00, false);

    -- Paciente 354 | Fecha: 2014-08-19 | Total: 8566.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (354, 1, '2014-08-19', 8566.00, NULL, 7)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 805.00, 1.00, '48', 1, 805.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 805.00, 1.00, '47', 1, 805.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 195, 2520.00, 1.00, '47', 1, 2520.00, 60.00, 1008.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 2520.00, 1.00, '12', 1, 2520.00, 60.00, 1008.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 805.00, 1.00, '48-47', 2, 1610.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 212, 6550.00, 1.00, NULL, 1, 6550.00, 0.00, 6550.00, false);

    -- Paciente 1397 | Fecha: 2014-09-04 | Total: 227460.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1397, 1, '2014-09-04', 227460.00, NULL, 7)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 600.00, 1.00, NULL, 1, 600.00, 15.00, 510.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2120.00, 1.00, '17-27', 2, 4240.00, 15.00, 3604.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 1920.00, 1.00, '13-22', 2, 3840.00, 15.00, 3264.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2220.00, 1.00, '21', 1, 2220.00, 15.00, 1887.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2520.00, 1.00, '17-14-27', 3, 7560.00, 15.00, 6426.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1210.00, 1.00, '44-21', 2, 2420.00, 15.00, 2057.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 805.00, 1.00, '37-34-43-44', 4, 3220.00, 15.00, 2737.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 805.00, 1.00, '13-11-22', 3, 2415.00, 15.00, 2053.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 86, 505.00, 1.00, '14-13-11-21-22-43', 6, 3030.00, 15.00, 2576.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3830.00, 1.00, '37-34-43-44', 4, 15320.00, 15.00, 13022.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3830.00, 1.00, '13-11-21-22', 4, 15320.00, 15.00, 13022.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7055.00, 1.00, '35-36-45-46-15', 5, 35275.00, 15.00, 29984.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2520.00, 1.00, '35-36-45-46-15', 5, 12600.00, 5.00, 11970.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4030.00, 1.00, '35-36-45-46-15', 5, 20150.00, 15.00, 17128.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 79, 600.00, 1.00, NULL, 1, 600.00, 15.00, 510.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 161, 2120.00, 1.00, '17-27', 2, 4240.00, 15.00, 3604.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 162, 1920.00, 1.00, '13-22', 2, 3840.00, 15.00, 3264.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 159, 2220.00, 1.00, '21', 1, 2220.00, 15.00, 1887.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 2520.00, 1.00, '17-27-14', 3, 7560.00, 15.00, 6426.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1210.00, 1.00, '44-21', 2, 2420.00, 15.00, 2057.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 224, 805.00, 1.00, '37-34-43-44', 4, 3220.00, 15.00, 2737.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 224, 805.00, 1.00, '13-11-22', 1, 805.00, 15.00, 684.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 86, 505.00, 1.00, '13-11-21-22-44', 5, 2525.00, 15.00, 2146.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3830.00, 1.00, '37-34-43-44', 4, 15320.00, 15.00, 13022.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3830.00, 1.00, '13-11-21-22', 4, 15320.00, 15.00, 13022.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 212, 6550.00, 1.00, NULL, 1, 6550.00, 15.00, 5568.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7055.00, 1.00, '15', 1, 7055.00, 15.00, 5997.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 2520.00, 1.00, NULL, 1, 2520.00, 15.00, 2142.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 4030.00, 1.00, NULL, 1, 4030.00, 15.00, 3426.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 79, 600.00, 1.00, NULL, 1, 600.00, 15.00, 510.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 161, 2120.00, 1.00, '17-27', 2, 4240.00, 15.00, 3604.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 162, 1920.00, 1.00, '13-22', 2, 3840.00, 15.00, 3264.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 159, 2220.00, 1.00, '21', 1, 2220.00, 15.00, 1887.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 197, 2520.00, 1.00, '17-27-14-37', 4, 10080.00, 15.00, 8568.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 201, 1210.00, 1.00, '44-21', 2, 2420.00, 15.00, 2057.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 224, 805.00, 1.00, '37-34-43-44', 4, 3220.00, 15.00, 2737.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 224, 805.00, 1.00, '13-11-22', 3, 2415.00, 15.00, 2053.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 86, 505.00, 1.00, '13-11-21-22-43', 5, 2525.00, 15.00, 2146.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 212, 6550.00, 1.00, NULL, 1, 6550.00, 15.00, 5568.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 185, 3830.00, 1.00, '34-43-44', 3, 11490.00, 15.00, 9766.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 195, 2520.00, 1.00, '13-11-21-22', 4, 10080.00, 15.00, 8568.00, false);

    -- Paciente 1397 | Fecha: 2014-09-10 | Total: 47331.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1397, 1, '2014-09-10', 47331.00, '{"A":"PZAS.17/27 POSIBLE TRATAMIENTO DE CONDUCTO BS.1802.- CADA UNO CON EL RESPECTIVO DESCUENTO."}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2520.00, 1.00, '17/25/27/14', 4, 10080.00, 15.00, 8568.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 86, 505.00, 1.00, '11/21', 2, 1010.00, 15.00, 858.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 220, 780.00, 1.00, '11/21', 2, 1560.00, 15.00, 1326.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2220.00, 1.00, '21', 1, 2220.00, 15.00, 1887.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7055.00, 1.00, '35/36/45', 3, 21165.00, 15.00, 17990.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2520.00, 1.00, '35/36/45', 3, 7560.00, 15.00, 6426.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4030.00, 1.00, '35/36/45', 3, 12090.00, 15.00, 10276.00, false);

    -- Paciente 511 | Fecha: 2014-09-10 | Total: 9192.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (511, 1, '2014-09-10', 9192.00, NULL, 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3830.00, 1.00, '35/36/37', 3, 11490.00, 20.00, 9192.00, false);

    -- Paciente 511 | Fecha: 2014-09-10 | Total: 15096.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (511, 1, '2014-09-10', 15096.00, NULL, 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 229, 1680.00, 1.00, '35/36/37', 3, 5040.00, 20.00, 4032.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3830.00, 1.00, '35/36/37', 3, 11490.00, 20.00, 9192.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 220, 780.00, 1.00, '35/36/37', 3, 2340.00, 20.00, 1872.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1210.00, 1.00, '36/37', 2, 2420.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1210.00, 1.00, '36/37', 2, 2420.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 201, 1210.00, 1.00, '36/37', 2, 2420.00, 100.00, 0.00, false);

    -- Paciente 1332 | Fecha: 2014-09-18 | Total: 7676.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1332, 1, '2014-09-18', 7676.00, NULL, 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 505.00, 1.00, '14/13/12/11/12', 5, 2525.00, 20.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 505.00, 1.00, '21/22/23/24', 4, 2020.00, 20.00, 1616.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 505.00, 1.00, '45/44/43/42/41', 5, 2525.00, 20.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 505.00, 1.00, '31/32/33/34/35', 5, 2525.00, 20.00, 2020.00, false);

    -- Paciente 240 | Fecha: 2014-09-19 | Total: 6697.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (240, 1, '2014-09-19', 6697.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 805.00, 1.00, '11', 1, 805.00, 0.00, 805.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 505.00, 1.00, '12/21/22', 3, 1515.00, 0.00, 1515.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 113, 340.00, 1.00, '11', 1, 340.00, 0.00, 340.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 960.00, 1.00, NULL, 1, 960.00, 0.00, 960.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 805.00, 1.00, '11', 1, 805.00, 15.00, 684.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 505.00, 1.00, '12/21/22', 3, 1515.00, 15.00, 1288.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 113, 340.00, 1.00, '11', 1, 340.00, 15.00, 289.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 345, 960.00, 1.00, NULL, 1, 960.00, 15.00, 816.00, false);

    -- Paciente 240 | Fecha: 2014-09-19 | Total: 2261.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (240, 1, '2014-09-19', 2261.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 805.00, 1.00, '11', 1, 805.00, 15.00, 684.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 505.00, 1.00, '12/22/21', 3, 1515.00, 15.00, 1288.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 113, 340.00, 1.00, '11', 1, 340.00, 15.00, 289.00, false);

    -- Paciente 240 | Fecha: 2015-12-17 | Total: 15280.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (240, 1, '2015-12-17', 15280.00, NULL, 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '26/36', 2, 5780.00, 0.00, 5780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 2210.00, 1.00, '25', 1, 2210.00, 0.00, 2210.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '25', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '23', 1, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '25', 1, 4400.00, 0.00, 4400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 580.00, 1.00, '25', 1, 580.00, 0.00, 580.00, false);

    -- Paciente 293 | Fecha: 2014-09-23 | Total: 36271.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (293, 1, '2014-09-23', 36271.00, NULL, 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2120.00, 1.00, '36/46', 2, 4240.00, 30.00, 2968.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1210.00, 1.00, '17/36/44/45/46', 5, 6050.00, 30.00, 4235.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3830.00, 1.00, '17/35/36/44/45/46', 6, 22980.00, 30.00, 16086.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 805.00, 1.00, '35/37', 2, 1610.00, 30.00, 1127.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 505.00, 1.00, '37', 1, 505.00, 30.00, 354.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 505.00, 1.00, '33/32/31/41/42/43', 6, 3030.00, 30.00, 2121.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 805.00, 1.00, '11/14/21/23', 4, 3220.00, 30.00, 2254.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 600.00, 1.00, NULL, 1, 600.00, 30.00, 420.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 212, 6550.00, 1.00, NULL, 1, 6550.00, 30.00, 4585.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 505.00, 1.00, '17/36/35/44/45/46', 6, 3030.00, 30.00, 2121.00, false);

    -- Paciente 216 | Fecha: 2014-10-01 | Total: 32755.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (216, 1, '2014-10-01', 32755.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3830.00, 1.00, '45/46/47', 3, 11490.00, 0.00, 11490.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7055.00, 1.00, '46', 1, 7055.00, 0.00, 7055.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 4030.00, 1.00, '46', 1, 4030.00, 0.00, 4030.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 2520.00, 1.00, '46', 1, 2520.00, 0.00, 2520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3830.00, 1.00, '45/47', 2, 7660.00, 0.00, 7660.00, false);

    -- Paciente 216 | Fecha: 2018-09-26 | Total: 11530.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (216, 1, '2018-09-26', 11530.00, NULL, 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '15', 1, 5690.00, 0.00, 5690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '15', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '14', 1, 3180.00, 0.00, 3180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '17/12', 2, 2020.00, 0.00, 2020.00, false);

    -- Paciente 1155 | Fecha: 2014-10-03 | Total: 14110.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1155, 1, '2014-10-03', 14110.00, NULL, 7)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 3025.00, 1.00, '11-21', 2, 6050.00, 0.00, 6050.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 114, 1510.00, 1.00, '11-21', 2, 3020.00, 0.00, 3020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 115, 2520.00, 1.00, '11-21', 2, 5040.00, 0.00, 5040.00, false);

    -- Paciente 1155 | Fecha: 2014-10-15 | Total: 11090.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1155, 1, '2014-10-15', 11090.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 3025.00, 1.00, '11/21', 2, 6050.00, 0.00, 6050.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 2520.00, 1.00, '11/21', 2, 5040.00, 0.00, 5040.00, false);

    -- Paciente 144 | Fecha: 2014-10-14 | Total: 303785.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (144, 1, '2014-10-14', 303785.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2120.00, 1.00, '26/27/16/17', 4, 8480.00, 0.00, 8480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2120.00, 1.00, '36/37/46/47', 4, 8480.00, 0.00, 8480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 1920.00, 1.00, '14/15/24/25', 4, 7680.00, 0.00, 7680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 1920.00, 1.00, '34/35/44/45', 4, 7680.00, 0.00, 7680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1210.00, 1.00, '14/15/16/17/24/25', 6, 7260.00, 0.00, 7260.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1210.00, 1.00, '26/27/34/35/36/37', 6, 7260.00, 0.00, 7260.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1210.00, 1.00, '44/45/46/47', 4, 4840.00, 0.00, 4840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3830.00, 1.00, '24/25/26/27/14/15', 6, 22980.00, 0.00, 22980.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3830.00, 1.00, '16/17/34/35/36/37', 6, 22980.00, 0.00, 22980.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3830.00, 1.00, '44/45/46/47', 4, 15320.00, 0.00, 15320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 2520.00, 1.00, '13/12/11/21/22/23', 6, 15120.00, 0.00, 15120.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 2520.00, 1.00, '33/32/31/41/42/43', 6, 15120.00, 0.00, 15120.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 199, 3025.00, 1.00, '14/15/16/17/24/25', 6, 18150.00, 0.00, 18150.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 199, 3025.00, 1.00, '44/45/46/47', 4, 12100.00, 0.00, 12100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 177, 3025.00, 1.00, '11/12/13/23/22/21', 6, 18150.00, 0.00, 18150.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 177, 3025.00, 1.00, '33/32/31/41/42/43', 6, 18150.00, 0.00, 18150.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 197, 2520.00, 1.00, '14/15/16/17/24/25', 6, 15120.00, 0.00, 15120.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 197, 2520.00, 1.00, '26/27/34/35/36/37', 6, 15120.00, 0.00, 15120.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 197, 2520.00, 1.00, '44/45/46/47', 4, 10080.00, 0.00, 10080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 115, 2520.00, 1.00, '11/12/13/21/22/23', 6, 15120.00, 0.00, 15120.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 115, 2520.00, 1.00, '33/32/31/41/42/43', 6, 15120.00, 0.00, 15120.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 199, 3025.00, 1.00, '26/27/34/35/36', 5, 15125.00, 0.00, 15125.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1210.00, 1.00, '37', 1, 1210.00, 0.00, 1210.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3830.00, 1.00, '37', 1, 3830.00, 0.00, 3830.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 237, 2110.00, 1.00, NULL, 1, 2110.00, 0.00, 2110.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 238, 1200.00, 1.00, NULL, 1, 1200.00, 0.00, 1200.00, false);

    -- Paciente 1431 | Fecha: 2014-11-10 | Total: 2240.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1431, 1, '2014-11-10', 2240.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 505.00, 1.00, '11/12/13/21/43/45', 6, 3030.00, 30.00, 2121.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 381, 170.00, 1.00, '31', 1, 170.00, 30.00, 119.00, false);

    -- Paciente 1473 | Fecha: 2014-12-01 | Total: 6550.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1473, 1, '2014-12-01', 6550.00, NULL, 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 212, 6550.00, 1.00, NULL, 1, 6550.00, 0.00, 6550.00, false);

    -- Paciente 1451 | Fecha: 2014-12-03 | Total: 2645.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1451, 1, '2014-12-03', 2645.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 381, 170.00, 1.00, '46/35', 2, 170.00, 0.00, 170.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 505.00, 1.00, '36/21/11', 3, 1515.00, 0.00, 1515.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 960.00, 1.00, NULL, 1, 960.00, 0.00, 960.00, false);

    -- Paciente 895 | Fecha: 2014-12-09 | Total: 14360.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (895, 1, '2014-12-09', 14360.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2120.00, 1.00, '37', 1, 2120.00, 20.00, 1696.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1210.00, 1.00, '37/35', 2, 2420.00, 20.00, 1936.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3830.00, 1.00, '37/36/35', 3, 11490.00, 20.00, 9192.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 1920.00, 1.00, '35', 1, 1920.00, 20.00, 1536.00, false);

    -- Paciente 1458 | Fecha: 2014-12-10 | Total: 35770.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1458, 1, '2014-12-10', 35770.00, '{"C":"FASE DE REHABILITACION ORAL"}', 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 116, 505.00, 1.00, '46/45/44/43/14/24', 6, 3030.00, 0.00, 3030.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 116, 505.00, 1.00, '35/34/33', 3, 1515.00, 0.00, 1515.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 116, 505.00, 1.00, '31/32/41/42', 4, 2020.00, 0.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 197, 2520.00, 1.00, '17/16/36', 3, 7560.00, 0.00, 7560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 201, 1210.00, 1.00, '26/27', 2, 2420.00, 0.00, 2420.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 185, 3830.00, 1.00, '26/27', 2, 7660.00, 0.00, 7660.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4030.00, 1.00, '37', 1, 4030.00, 15.00, 3426.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2520.00, 1.00, '37', 1, 2520.00, 15.00, 2142.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7055.00, 1.00, '37', 1, 7055.00, 15.00, 5997.00, false);

    -- Paciente 1064 | Fecha: 2014-12-16 | Total: 5640.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1064, 1, '2014-12-16', 5640.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 600.00, 1.00, NULL, 1, 600.00, 0.00, 600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1210.00, 1.00, '16', 1, 1210.00, 0.00, 1210.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3830.00, 1.00, '16', 1, 3830.00, 0.00, 3830.00, false);

    -- Paciente 1064 | Fecha: 2014-12-16 | Total: 3625.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1064, 1, '2014-12-16', 3625.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 600.00, 1.00, NULL, 1, 600.00, 0.00, 600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 199, 3025.00, 1.00, '16', 1, 3025.00, 0.00, 3025.00, false);

    -- Paciente 1497 | Fecha: 2014-12-23 | Total: 16605.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1497, 1, '2014-12-23', 16605.00, NULL, 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 240, 3000.00, 1.00, '22', 1, 3000.00, 0.00, 3000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7055.00, 1.00, '22', 1, 7055.00, 0.00, 7055.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 2520.00, 1.00, '22', 1, 2520.00, 0.00, 2520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 4030.00, 1.00, '22', 1, 4030.00, 0.00, 4030.00, false);

    -- Paciente 1279 | Fecha: 2015-01-21 | Total: 3936.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1279, 1, '2015-01-21', 3936.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3830.00, 1.00, '33/43', 2, 7660.00, 70.00, 2298.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 212, 6550.00, 1.00, NULL, 1, 6550.00, 75.00, 1638.00, false);

    -- Paciente 1279 | Fecha: 2015-01-21 | Total: 3936.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1279, 1, '2015-01-21', 3936.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3830.00, 1.00, '33/43', 2, 7660.00, 70.00, 2298.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 212, 6550.00, 1.00, NULL, 1, 6550.00, 75.00, 1638.00, false);

    -- Paciente 1483 | Fecha: 2015-01-23 | Total: 151065.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1483, 1, '2015-01-23', 151065.00, NULL, 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7055.00, 1.00, '15/16/17', 3, 7055.00, 0.00, 7055.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7055.00, 1.00, '24/27', 2, 14110.00, 0.00, 14110.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7055.00, 1.00, '34/35/36', 3, 21165.00, 0.00, 21165.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7055.00, 1.00, '43/45/46', 3, 21165.00, 0.00, 21165.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 212, 6550.00, 1.00, NULL, 2, 13100.00, 0.00, 13100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3830.00, 1.00, '21', 1, 3830.00, 0.00, 3830.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 163, 2015.00, 1.00, '14', 1, 2015.00, 0.00, 2015.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 162, 1920.00, 1.00, '13/11', 2, 3840.00, 0.00, 3840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 201, 1210.00, 1.00, '14/12/11', 3, 3630.00, 0.00, 3630.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 185, 3830.00, 1.00, '14/13/12/11/21', 5, 19150.00, 0.00, 19150.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 185, 3830.00, 1.00, '14/13/12/11/21', 5, 19150.00, 0.00, 19150.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 113, 340.00, 1.00, '22/23', 2, 680.00, 0.00, 680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 116, 505.00, 1.00, '22/23', 2, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 292, 7055.00, 1.00, '15/16/24', 3, 21165.00, 0.00, 21165.00, false);

    -- Paciente 1437 | Fecha: 2014-10-15 | Total: 40003.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1437, 1, '2014-10-15', 40003.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2520.00, 1.00, '17-16-27-46-47', 5, 12600.00, 0.00, 12600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 505.00, 1.00, '16-46-47', 3, 1515.00, 0.00, 1515.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 805.00, 1.00, '15-13-12-11-28-22', 6, 4830.00, 0.00, 4830.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3830.00, 1.00, '26-27-44', 3, 11490.00, 0.00, 11490.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1210.00, 1.00, '44-27', 2, 2420.00, 0.00, 2420.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 203, 1510.00, 1.00, NULL, 1, 1510.00, 0.00, 1510.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 600.00, 1.00, NULL, 1, 600.00, 0.00, 600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 805.00, 1.00, '34-37', 2, 1610.00, 0.00, 1610.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2120.00, 1.00, '27', 1, 2120.00, 0.00, 2120.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 6, 1308.00, 1.00, NULL, 1, 1308.00, 0.00, 1308.00, false);

    -- Paciente 1437 | Fecha: 2021-11-10 | Total: 10590.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1437, 1, '2021-11-10', 10590.00, '{"A":"EXISTE POSIBILIDAD DE TRATAMIENTO DE ENDODONCIA (3.170 BS)","B":"EXISTE POSIBILIDAD DE TRATAMIENTO DE ENDODONCIA (3.170 BS)"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '17-16', 2, 6360.00, 0.00, 6360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1050.00, 1.00, '17', 1, 1050.00, 0.00, 1050.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '16', 1, 3180.00, 0.00, 3180.00, false);

    -- Paciente 1478 | Fecha: 2015-04-27 | Total: 10540.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1478, 1, '2015-04-27', 10540.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 580.00, 1.00, '27', 2, 1160.00, 0.00, 1160.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 3010.00, 1.00, '27', 1, 3010.00, 0.00, 3010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '27', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 580.00, 1.00, '27', 1, 580.00, 0.00, 580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '27', 1, 4400.00, 0.00, 4400.00, false);

    -- Paciente 1550 | Fecha: 2015-04-29 | Total: 38900.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1550, 1, '2015-04-29', 38900.00, NULL, 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '14/15', 2, 5780.00, 0.00, 5780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '17/18', 2, 1840.00, 0.00, 1840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 8110.00, 1.00, '35/36', 2, 16220.00, 0.00, 16220.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2900.00, 1.00, '35/36', 2, 5800.00, 0.00, 5800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4630.00, 1.00, '35/36', 2, 9260.00, 0.00, 9260.00, false);

    -- Paciente 1564 | Fecha: 2015-04-30 | Total: 13850.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1564, 1, '2015-04-30', 13850.00, '{"A":"POSIBLE TRATAMIENTO DE CONDUCTOS EN PIEZA DENTAL 28 : 2440 BS"}', 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2440.00, 1.00, '18', 1, 2440.00, 0.00, 2440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 163, 2310.00, 1.00, '14', 1, 2310.00, 0.00, 2310.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '18/14/16/28', 4, 3680.00, 0.00, 3680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '15/22/23', 3, 1740.00, 0.00, 1740.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 920.00, 1.00, '17/24/26/27', 4, 3680.00, 0.00, 3680.00, false);

    -- Paciente 1226 | Fecha: 2015-04-30 | Total: 40070.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1226, 1, '2015-04-30', 40070.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 690.00, 1.00, NULL, 1, 690.00, 0.00, 690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 580.00, 1.00, '16/44/45/', 3, 1740.00, 0.00, 1740.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 238, 1380.00, 1.00, NULL, 2, 2760.00, 0.00, 2760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 920.00, 1.00, '36/24', 2, 1840.00, 0.00, 1840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 920.00, 1.00, '23/13/12/11/21/22', 6, 5520.00, 0.00, 5520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '46/47', 2, 5780.00, 0.00, 5780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 580.00, 1.00, '13/12/11/21/22/23', 6, 3480.00, 0.00, 3480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 580.00, 1.00, '24/25/26/44/45', 5, 2900.00, 0.00, 2900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 920.00, 1.00, '15/14/44', 3, 2760.00, 0.00, 2760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '33/43', 2, 1160.00, 0.00, 1160.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '45', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 162, 2210.00, 1.00, '13/21/22/11/45', 5, 11050.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 161, 2440.00, 1.00, '16/17', 2, 4880.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 159, 2550.00, 1.00, '12/23/44', 3, 7650.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 42, 340.00, 1.00, '16', 1, 340.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 86, 580.00, 1.00, '14/13/12/11/21/22', 6, 3480.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 86, 580.00, 1.00, '23/44', 2, 1160.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '44/45', 2, 8800.00, 0.00, 8800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 24, 400.00, 1.00, NULL, 1, 400.00, 0.00, 400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 326, 850.00, 1.00, '36/46/47', 1, 850.00, 0.00, 850.00, false);

    -- Paciente 691 | Fecha: 2015-05-04 | Total: 17830.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (691, 1, '2015-05-04', 17830.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 165, 690.00, 1.00, '36/37', 2, 1380.00, 0.00, 1380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '35', 1, 4400.00, 0.00, 4400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '35', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '44/45', 2, 5780.00, 0.00, 5780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2440.00, 1.00, '36/37', 2, 4880.00, 0.00, 4880.00, false);

    -- Paciente 263 | Fecha: 2018-07-20 | Total: 305860.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (263, 1, '2018-07-20', 305860.00, NULL, 7)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 35, 1400.00, 1.00, '18-28', 2, 2800.00, 0.00, 2800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '13-23', 2, 11380.00, 0.00, 11380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 114, 1900.00, 1.00, '12-11-21-22', 4, 7600.00, 0.00, 7600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '24-25', 2, 3060.00, 0.00, 3060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3950.00, 1.00, '24-25', 2, 7900.00, 0.00, 7900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '27', 1, 3180.00, 0.00, 3180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 36, 2030.00, 1.00, '38-48', 2, 4060.00, 0.00, 4060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3950.00, 1.00, '37-36-35-34', 4, 15800.00, 0.00, 15800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '33-43', 2, 11380.00, 0.00, 11380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 114, 1900.00, 1.00, '32-31-41-42', 4, 7600.00, 0.00, 7600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3950.00, 1.00, '44-45-46-47', 4, 15800.00, 0.00, 15800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 203, 1900.00, 1.00, NULL, 1, 1900.00, 0.00, 1900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 35, 1400.00, 1.00, '18-28', 2, 2800.00, 0.00, 2800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5690.00, 1.00, '13-23', 2, 11380.00, 0.00, 11380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3190.00, 1.00, '12-11-21-22', 4, 12760.00, 0.00, 12760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1530.00, 1.00, '24-25', 2, 3060.00, 0.00, 3060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3950.00, 1.00, '24-25', 2, 7900.00, 0.00, 7900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '27', 1, 3180.00, 0.00, 3180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '38-48', 2, 2020.00, 0.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '37-36-35-34', 4, 12720.00, 0.00, 12720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5690.00, 1.00, '33-43', 2, 11380.00, 0.00, 11380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3190.00, 1.00, '32-31-41-42', 4, 12760.00, 0.00, 12760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '44-45-47', 3, 9540.00, 0.00, 9540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 203, 1900.00, 1.00, NULL, 1, 1900.00, 0.00, 1900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 34, 1010.00, 1.00, '18-28', 2, 2020.00, 0.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 380, 5690.00, 1.00, '13-12-11-21-22-23', 6, 34140.00, 0.00, 34140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 201, 1530.00, 1.00, '24-25', 2, 3060.00, 0.00, 3060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 185, 3950.00, 1.00, '24-25', 2, 7900.00, 0.00, 7900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 197, 3180.00, 1.00, '27', 1, 3180.00, 0.00, 3180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 185, 3950.00, 1.00, '37-36-35-34', 4, 15800.00, 0.00, 15800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 380, 5690.00, 1.00, '33-32-31-41-42-43', 6, 34140.00, 0.00, 34140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 185, 3950.00, 1.00, '44-45-46-47', 4, 15800.00, 0.00, 15800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 36, 2030.00, 1.00, '38-48', 2, 4060.00, 0.00, 4060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 203, 1900.00, 1.00, NULL, 1, 1900.00, 0.00, 1900.00, false);

    -- Paciente 1447 | Fecha: 2015-05-06 | Total: 24560.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1447, 1, '2015-05-06', 24560.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 283, 460.00, 1.00, '14', 1, 460.00, 20.00, 368.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '11/21/22/23/24/25', 6, 3480.00, 20.00, 2784.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '33/43', 2, 1160.00, 20.00, 928.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2440.00, 1.00, '36', 1, 2440.00, 20.00, 1952.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '36', 1, 1390.00, 20.00, 1112.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '36', 1, 4400.00, 20.00, 3520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1390.00, 1.00, '27/46/44', 3, 4170.00, 20.00, 3336.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 4400.00, 1.00, '27/46/44', 3, 13200.00, 20.00, 10560.00, false);

    -- Paciente 677 | Fecha: 2015-06-09 | Total: 20850.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (677, 1, '2015-06-09', 20850.00, '{"A":"PIEZA DENTAL 26  POSIBLE RELLENO OSEO, PRECIO 3480 BS."}', 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 8110.00, 1.00, '26', 1, 8110.00, 0.00, 8110.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2900.00, 1.00, '26', 1, 2900.00, 0.00, 2900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4630.00, 1.00, '26', 1, 4630.00, 0.00, 4630.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 215, 5210.00, 1.00, '26', 1, 5210.00, 0.00, 5210.00, false);

    -- Paciente 57 | Fecha: 2015-06-16 | Total: 4400.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (57, 1, '2015-06-16', 4400.00, NULL, 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 580.00, 1.00, '25', 1, 580.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '25', 1, 4400.00, 0.00, 4400.00, false);

    -- Paciente 1608 | Fecha: 2015-06-16 | Total: 4990.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1608, 1, '2015-06-16', 4990.00, NULL, 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 2, 340.00, 1.00, NULL, 1, 340.00, 0.00, 340.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 169, 2100.00, 1.00, '22', 1, 2100.00, 0.00, 2100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2550.00, 1.00, '22', 1, 2550.00, 0.00, 2550.00, false);

    -- Paciente 1610 | Fecha: 2015-06-17 | Total: 6760.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1610, 1, '2015-06-17', 6760.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 35, 1270.00, 1.00, '18-28', 2, 2540.00, 0.00, 2540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 35, 1270.00, 1.00, '18-28', 2, 2540.00, 0.00, 2540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 347, 1680.00, 1.00, NULL, 1, 1680.00, 0.00, 1680.00, false);

    -- Paciente 1596 | Fecha: 2015-06-26 | Total: 1840.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1596, 1, '2015-06-26', 1840.00, NULL, 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 283, 460.00, 1.00, '55/65/75/85', 4, 1840.00, 0.00, 1840.00, false);

    -- Paciente 1465 | Fecha: 2015-07-14 | Total: 27890.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1465, 1, '2015-07-14', 27890.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 920.00, 1.00, '35/36', 2, 1840.00, 0.00, 1840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '35/36', 2, 8800.00, 0.00, 8800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 224, 920.00, 1.00, '35/36', 2, 1840.00, 0.00, 1840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 195, 2900.00, 1.00, '35/36', 2, 5800.00, 0.00, 5800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 214, 8690.00, 1.00, NULL, 1, 8690.00, 0.00, 8690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '34', 1, 920.00, 0.00, 920.00, false);

    -- Paciente 1465 | Fecha: 2015-07-14 | Total: 18300.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1465, 1, '2015-07-14', 18300.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 224, 920.00, 1.00, '35/36', 2, 1840.00, 0.00, 1840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 195, 2900.00, 1.00, '35/36', 2, 5800.00, 0.00, 5800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 214, 8690.00, 1.00, NULL, 1, 8690.00, 0.00, 8690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1390.00, 1.00, '34', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 580.00, 1.00, '34', 1, 580.00, 0.00, 580.00, false);

    -- Paciente 1643 | Fecha: 2015-07-28 | Total: 6800.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1643, 1, '2015-07-28', 6800.00, NULL, 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 278, 460.00, 1.00, '55/65', 2, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '36/46/47', 3, 1740.00, 0.00, 1740.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 283, 460.00, 1.00, '14/16/17/24/26', 5, 2300.00, 0.00, 2300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 283, 460.00, 1.00, '34/35/44/45', 4, 1840.00, 0.00, 1840.00, false);

    -- Paciente 121 | Fecha: 2015-07-30 | Total: 11120.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (121, 1, '2015-07-30', 11120.00, NULL, 7)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 86, 580.00, 1.00, '45-47', 2, 1160.00, 20.00, 928.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 920.00, 1.00, '45', 1, 920.00, 20.00, 736.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '47', 1, 1390.00, 20.00, 1112.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 8110.00, 1.00, '46', 1, 8110.00, 20.00, 6488.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 239, 2320.00, 1.00, NULL, 1, 2320.00, 20.00, 1856.00, false);

    -- Paciente 121 | Fecha: 2015-07-30 | Total: 8888.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (121, 1, '2015-07-30', 8888.00, NULL, 7)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 920.00, 1.00, '47-45', 2, 1840.00, 20.00, 1472.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 383, 2310.00, 1.00, NULL, 1, 2310.00, 20.00, 1848.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 82, 3480.00, 1.00, '47-45', 2, 6960.00, 20.00, 5568.00, false);

    -- Paciente 121 | Fecha: 2017-06-16 | Total: 6977.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (121, 1, '2017-06-16', 6977.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '27', 1, 2890.00, 40.00, 1734.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5170.00, 1.00, '25', 1, 5170.00, 30.00, 3619.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 45, 2900.00, 1.00, '26', 1, 2900.00, 60.00, 1160.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 580.00, 1.00, '26', 1, 580.00, 20.00, 464.00, false);

    -- Paciente 1645 | Fecha: 2015-08-19 | Total: 10336.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1645, 1, '2015-08-19', 10336.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '24/25', 2, 2780.00, 15.00, 2363.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '24/25', 2, 8800.00, 15.00, 7480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 86, 580.00, 1.00, '24', 1, 580.00, 15.00, 493.00, false);

    -- Paciente 1645 | Fecha: 2018-01-04 | Total: 1832.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1645, 1, '2018-01-04', 1832.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '13/32', 2, 1280.00, 20.00, 1024.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '35/', 1, 1010.00, 20.00, 808.00, false);

    -- Paciente 1632 | Fecha: 2015-08-20 | Total: 36360.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1632, 1, '2015-08-20', 36360.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 8110.00, 1.00, NULL, 1, 8110.00, 0.00, 8110.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2900.00, 1.00, NULL, 1, 2900.00, 0.00, 2900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4630.00, 1.00, NULL, 1, 4630.00, 0.00, 4630.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 215, 5210.00, 1.00, NULL, 1, 5210.00, 0.00, 5210.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, NULL, 3, 13200.00, 0.00, 13200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 163, 2310.00, 1.00, NULL, 1, 2310.00, 0.00, 2310.00, false);

    -- Paciente 367 | Fecha: 2015-04-01 | Total: 8800.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (367, 1, '2015-04-01', 8800.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '11/21', 2, 8800.00, 0.00, 8800.00, false);

    -- Paciente 114 | Fecha: 2015-04-06 | Total: 11390.48
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (114, 1, '2015-04-06', 11390.48, '{"A":"PIEZA 35 - 45 Y 46 POSIBLE MUÑON PERNO PRECIO 1390.- BS\r\nPIEZA 16 Y 17  POSIBLE CORONA METAL PORCELANA PRECIO POR UNIDAD 4400.- BS"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2440.00, 1.00, '16/17', 2, 4880.00, 26.22, 3600.46, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 1720.00, 1.00, '16/17', 2, 3440.00, 41.86, 2000.02, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '26', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '26/35/45/46', 4, 4400.00, 0.00, 4400.00, false);

    -- Paciente 114 | Fecha: 2023-06-20 | Total: 17760.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (114, 1, '2023-06-20', 17760.00, NULL, 20)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 245, 5690.00, 1.00, '13-23', 2, 11380.00, 0.00, 11380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3190.00, 1.00, '13-23', 2, 6380.00, 0.00, 6380.00, false);

    -- Paciente 913 | Fecha: 2015-06-02 | Total: 40440.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (913, 1, '2015-06-02', 40440.00, NULL, 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '17', 1, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '15', 1, 2890.00, 0.00, 2890.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '14', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '14', 1, 4400.00, 0.00, 4400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 114, 1730.00, 1.00, '11', 1, 1730.00, 0.00, 1730.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '21/23/23', 3, 1740.00, 0.00, 1740.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 8110.00, 1.00, '25', 1, 8110.00, 0.00, 8110.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '37/36/34', 3, 8670.00, 0.00, 8670.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 3010.00, 1.00, '46', 1, 3010.00, 0.00, 3010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '46', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '46', 1, 4400.00, 0.00, 4400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1100.00, 1.00, NULL, 1, 1100.00, 0.00, 1100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 690.00, 1.00, NULL, 1, 690.00, 0.00, 690.00, false);

    -- Paciente 1590 | Fecha: 2015-06-04 | Total: 4600.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1590, 1, '2015-06-04', 4600.00, NULL, 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '47/46/45/35/37', 5, 4600.00, 0.00, 4600.00, false);

    -- Paciente 1532 | Fecha: 2015-04-09 | Total: 4000.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1532, 1, '2015-04-09', 4000.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 112, 2000.00, 1.00, NULL, 2, 4000.00, 0.00, 4000.00, false);

    -- Paciente 397 | Fecha: 2015-04-09 | Total: 19530.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (397, 1, '2015-04-09', 19530.00, '{"B":"POSIBLE TRATAMIENTO DE CONDUCTOS PIEZA 47 BS 2440","C":"POSIBLE TRATAMIENTO DE CONDUCTOS  PZA 47 BS 2440"}', 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '38/37/36/47', 4, 11560.00, 0.00, 11560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 161, 2440.00, 1.00, '48', 1, 2440.00, 0.00, 2440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 165, 690.00, 1.00, '46/45', 2, 1380.00, 0.00, 1380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 920.00, 1.00, '48', 1, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 36, 1850.00, 1.00, '48', 1, 1850.00, 0.00, 1850.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 165, 690.00, 1.00, '46/45', 2, 1380.00, 0.00, 1380.00, false);

    -- Paciente 1566 | Fecha: 2015-04-10 | Total: 920.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1566, 1, '2015-04-10', 920.00, NULL, 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 920.00, 1.00, '17', 1, 920.00, 0.00, 920.00, false);

    -- Paciente 1440 | Fecha: 2015-05-11 | Total: 162410.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1440, 1, '2015-05-11', 162410.00, '{"A":"LOS TRATAMIENTOS SUGERIDOS PARA EL MAXILAR INFERIOR, ES DECIR PARA LOS ELEMENTOS DENTARIOS # 37-36-34-44-45-46 Y 47 SE MANTIENEN IGUAL PARA LAS TRES PROPUESTAS. LAS VARIANTES DE TRATAMIENTO PRESENTADAS SON PARA EL MAXILAR SUPERIOR."}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 114, 1730.00, 1.00, '13-12-11-21', 4, 6920.00, 0.00, 6920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 239, 2320.00, 1.00, NULL, 2, 2320.00, 0.00, 2320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 580.00, 1.00, '17', 1, 580.00, 0.00, 580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '34-33-32-31', 4, 2320.00, 0.00, 2320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '36-34', 2, 5780.00, 0.00, 5780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '37', 1, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1130.00, 1.00, '44', 1, 1130.00, 0.00, 1130.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 387, 10430.00, 1.00, NULL, 1, 10430.00, 0.00, 10430.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 114, 1730.00, 1.00, '13-12-11-21', 4, 6920.00, 0.00, 6920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 292, 8110.00, 1.00, '14-16-22-24-25', 5, 40550.00, 0.00, 40550.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 293, 2900.00, 1.00, '14-16-22-24-25', 5, 14500.00, 0.00, 14500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 294, 4630.00, 1.00, '14-15-16', 3, 13890.00, 0.00, 13890.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 183, 580.00, 1.00, '17', 1, 580.00, 0.00, 580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 294, 4630.00, 1.00, '22-23-24-25', 4, 18520.00, 0.00, 18520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 920.00, 1.00, '17-13-12-11-21', 5, 4600.00, 0.00, 4600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 76, 470.00, 1.00, '13-12-11-21', 4, 1880.00, 0.00, 1880.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 76, 470.00, 1.00, '13-12-11-21', 4, 1880.00, 0.00, 1880.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 212, 7530.00, 1.00, '45-46-47', 1, 7530.00, 0.00, 7530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 580.00, 1.00, '34-33-32-31', 4, 2320.00, 0.00, 2320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 2890.00, 1.00, '36-34', 2, 5780.00, 0.00, 5780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '41-42-43', 3, 1740.00, 0.00, 1740.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 580.00, 1.00, '41-42-43', 3, 1740.00, 0.00, 1740.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 212, 7530.00, 1.00, '45-46-47', 1, 7530.00, 0.00, 7530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 121, 1130.00, 1.00, '44', 1, 1130.00, 0.00, 1130.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 920.00, 1.00, '37', 1, 920.00, 0.00, 920.00, false);

    -- Paciente 1886 | Fecha: 2016-11-08 | Total: 4860.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1886, 1, '2016-11-08', 4860.00, NULL, 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '48', 1, 2890.00, 0.00, 2890.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 580.00, 1.00, '47', 1, 580.00, 0.00, 580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '47', 1, 1390.00, 0.00, 1390.00, false);

    -- Paciente 1886 | Fecha: 2016-11-08 | Total: 87500.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1886, 1, '2016-11-08', 87500.00, '{"B":"ARCADA SUPERIOR SECTORES 1 Y 2","A":"UNA VEZ REHALIZADO LA TOMA EN ARCO FACIAL Y EL ENCERADO, SE PODRA TENER UN DIAGNOSTICO MAS PRECISO PARA LA REHABILITACION ORAL.","C":"ARCADA SUPERIOR E INFERIOR: SECTOR 1, 2 Y 3\r\n FASE QUIRURGICA, IMPLANTES Y REHABILITACION SOBRE IMPLANTES","D":"ARCADA INFERIOR: SECTORES 3 Y 4"}', 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 86, 580.00, 1.00, '15', 1, 580.00, 0.00, 580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 237, 2430.00, 1.00, NULL, 1, 2430.00, 0.00, 2430.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 37, 1160.00, 1.00, '17', 1, 1160.00, 0.00, 1160.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1390.00, 1.00, '16', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 4400.00, 1.00, '16', 1, 4400.00, 0.00, 4400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 2890.00, 1.00, '15', 1, 2890.00, 0.00, 2890.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 580.00, 1.00, '12', 1, 580.00, 0.00, 580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 580.00, 1.00, '13/23', 2, 1160.00, 0.00, 1160.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 920.00, 1.00, '11', 1, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 34, 920.00, 1.00, '14/24', 2, 1840.00, 0.00, 1840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 82, 3480.00, 1.00, '14', 1, 3480.00, 0.00, 3480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 292, 8110.00, 1.00, '14/24', 2, 16220.00, 0.00, 16220.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 293, 2900.00, 1.00, '14/24', 2, 5800.00, 0.00, 5800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 294, 4630.00, 1.00, '14/24', 2, 9260.00, 0.00, 9260.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 294, 4630.00, 1.00, '21/35', 2, 9260.00, 0.00, 9260.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 165, 690.00, 1.00, '38', 1, 690.00, 0.00, 690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 197, 2890.00, 1.00, '38/37/36', 3, 8670.00, 0.00, 8670.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 116, 580.00, 1.00, '34', 1, 580.00, 0.00, 580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 116, 580.00, 1.00, '44', 1, 580.00, 0.00, 580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 197, 2890.00, 1.00, '46', 1, 2890.00, 0.00, 2890.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 158, 3010.00, 1.00, '47', 1, 3010.00, 0.00, 3010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 201, 1390.00, 1.00, '47', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 185, 4400.00, 1.00, '47', 1, 4400.00, 0.00, 4400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 210, 580.00, 1.00, '47', 1, 580.00, 0.00, 580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 117, 920.00, 1.00, '48', 1, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'E', 79, 690.00, 1.00, NULL, 1, 690.00, 0.00, 690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'E', 203, 1730.00, 1.00, NULL, 1, 1730.00, 0.00, 1730.00, false);

    -- Paciente 516 | Fecha: 2017-02-02 | Total: 83180.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (516, 1, '2017-02-02', 83180.00, '{"A":"EXISTE LA POSIBILIDAD DE REALIZAR RELLENO OSEO+MEMBRANA BS 4140"}', 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 920.00, 1.00, '27', 1, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '28', 1, 2890.00, 0.00, 2890.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 383, 2310.00, 1.00, '27/26', 1, 2310.00, 0.00, 2310.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 8110.00, 1.00, '26/27', 2, 16220.00, 0.00, 16220.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 313, 1750.00, 1.00, '26/27', 1, 1750.00, 0.00, 1750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 93, 4140.00, 1.00, '26/27', 2, 8280.00, 0.00, 8280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 4630.00, 1.00, '26/27', 2, 9260.00, 0.00, 9260.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 580.00, 1.00, '26', 1, 580.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1390.00, 1.00, '25', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 210, 580.00, 1.00, '25', 1, 580.00, 0.00, 580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 4840.00, 1.00, '25', 1, 4840.00, 0.00, 4840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 245, 5170.00, 1.00, '13/23', 2, 10340.00, 0.00, 10340.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 210, 580.00, 1.00, '12/11/21/22', 4, 580.00, 0.00, 580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 380, 5170.00, 1.00, '12/11/21/22', 4, 20680.00, 0.00, 20680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 117, 920.00, 1.00, '14/24', 2, 1840.00, 0.00, 1840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 62, 650.00, 1.00, '26/27', 2, 1300.00, 0.00, 1300.00, false);

    -- Paciente 2285 | Fecha: 2019-07-25 | Total: 12900.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2285, 1, '2019-07-25', 12900.00, '{"A":"PROMOCION IMPLANTE, MUÑON Y CORONA SOBRE IMPLANTE BS. 7000.\r\nEL PAGO ES UNICO EL DIA DE LA CIRUGIA."}', 13)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '25', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, NULL, 1, 1750.00, 0.00, 1750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4150.00, 1.00, '25', 1, 4150.00, 0.00, 4150.00, false);

    -- Paciente 2120 | Fecha: 2019-08-12 | Total: 1650.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2120, 1, '2019-08-12', 1650.00, NULL, 13)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '36', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 249, 640.00, 1.00, '36', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 31, 0.00, 1.00, '36', 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2382 | Fecha: 2019-08-19 | Total: 17900.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2382, 1, '2019-08-19', 17900.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 37, 1280.00, 1.00, '47', 1, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 2430.00, 1.00, '47', 1, 2430.00, 0.00, 2430.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '47/46', 1, 1530.00, 0.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '47/46', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '46/47', 2, 11380.00, 0.00, 11380.00, false);

    -- Paciente 631 | Fecha: 2019-05-31 | Total: 419496.50
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (631, 1, '2019-05-31', 419496.50, '{"D":"MAXILAR INFERIOR\r\nVERIFICAR RETRATAMIENTO DE CONDUCTOS ELEMENTO DENTAL 33-43","C":"TRATAMIENTO MAXILAR SUPERIOR"}', 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '13', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '14-23-24-33-43', 5, 28450.00, 0.00, 28450.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '12-11-13-21-22', 5, 35000.00, 0.00, 35000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '11-12-13-21-22', 5, 8750.00, 0.00, 8750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '41-42-31-32', 4, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '41-42-32', 3, 21000.00, 0.00, 21000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 203, 1900.00, 1.00, NULL, 1, 1900.00, 0.00, 1900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4150.00, 1.00, '12-11-13-21-22', 5, 20750.00, 0.00, 20750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4150.00, 1.00, '41-42-31-32', 4, 16600.00, 0.00, 16600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4150.00, 1.00, '15-16', 2, 8300.00, 0.00, 8300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '13', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5690.00, 1.00, '24-23-25-33-43', 5, 28450.00, 0.00, 28450.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '13-12-22', 3, 21000.00, 0.00, 21000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1750.00, 1.00, '13-12-22', 3, 5250.00, 0.00, 5250.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 4150.00, 1.00, '13-12-11-21-22', 5, 20750.00, 0.00, 20750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '42-32', 2, 14000.00, 0.00, 14000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1750.00, 1.00, '42--31-32', 3, 5250.00, 0.00, 5250.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 4150.00, 1.00, '42-41-31-32', 4, 16600.00, 0.00, 16600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 203, 1900.00, 1.00, NULL, 1, 1900.00, 0.00, 1900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 4150.00, 1.00, '15-16', 2, 8300.00, 0.00, 8300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 292, 7000.00, 1.00, '42/36', 2, 14000.00, 8.00, 12880.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 293, 1750.00, 1.00, '42/44/45/46', 4, 7000.00, 8.00, 6440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 293, 1750.00, 1.00, '36/35/34/32', 4, 7000.00, 8.00, 6440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 323, 14000.00, 1.00, NULL, 1, 14000.00, 8.00, 12880.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 295, 4550.00, 1.00, NULL, 1, 4550.00, 8.00, 4186.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 34, 1010.00, 1.00, '13', 1, 1010.00, 25.00, 757.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 292, 7000.00, 1.00, '13/12/11/21/22', 5, 35000.00, 8.00, 32200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 293, 1750.00, 1.00, '16/15/13/12/11', 5, 8750.00, 8.00, 8050.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 293, 1750.00, 1.00, '21/22/25', 3, 5250.00, 8.00, 4830.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 294, 4150.00, 1.00, '16/15/13/12/11/21', 6, 24900.00, 10.00, 22410.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 294, 4150.00, 1.00, '22/25', 2, 8300.00, 10.00, 7470.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 380, 5690.00, 1.00, '14/23/24', 3, 17070.00, 10.00, 15363.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 347, 1680.00, 1.00, NULL, 1, 1680.00, 0.00, 1680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 347, 1680.00, 1.00, NULL, 1, 1680.00, 0.00, 1680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 201, 1530.00, 1.00, '33-43', 2, 3060.00, 0.00, 3060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 185, 3950.00, 1.00, '33/43', 2, 7900.00, 0.00, 7900.00, false);

    -- Paciente 2315 | Fecha: 2019-08-27 | Total: 29630.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2315, 1, '2019-08-27', 29630.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '43-45', 2, 14000.00, 0.00, 14000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '43-45', 2, 3500.00, 0.00, 3500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4150.00, 1.00, '43-45', 2, 8300.00, 0.00, 8300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 82, 3830.00, 1.00, '43', 1, 3830.00, 0.00, 3830.00, false);

    -- Paciente 2321 | Fecha: 2022-03-04 | Total: 4230.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2321, 1, '2022-03-04', 4230.00, NULL, 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '27', 1, 3180.00, 0.00, 3180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '26', 1, 1050.00, 0.00, 1050.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2321 | Fecha: 2022-03-04 | Total: 15270.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2321, 1, '2022-03-04', 15270.00, NULL, 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1100.00, 1.00, '27', 1, 1100.00, 0.00, 1100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '27', 1, 3180.00, 0.00, 3180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '16/26', 2, 2100.00, 0.00, 2100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 224, 1100.00, 1.00, '27', 1, 1100.00, 0.00, 1100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5690.00, 1.00, '27', 1, 5690.00, 0.00, 5690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1050.00, 1.00, '16/26', 2, 2100.00, 0.00, 2100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2666 | Fecha: 2022-03-08 | Total: 1400.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2666, 1, '2022-03-08', 1400.00, '{"A":"IMPLANTE DE ELEMENTO DENTAL 36 DEBE SER EXTRAIDO POR LESION PERIIMPLANTAR. DESPUES DE UN TIEMPO SE DEBERA REALIZAR RELLENO OSEO PARA UNA POSTERIOR REHABILITACION CON NUEVO IMPLANTE"}', 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 325, 1400.00, 1.00, '36', 1, 1400.00, 0.00, 1400.00, false);

    -- Paciente 2486 | Fecha: 2022-03-08 | Total: 50520.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2486, 1, '2022-03-08', 50520.00, '{"A":"POSTERIOR A EL TRATAMIENTO DE ACLARAMIENTO DENTAL, SE VALORARA EL PLAN DE TRATAMIENTO PARA LAS CARILLAS DENTALES, PRUIMERO UN ENCERADO Y MOCK UP (PRUEBA ) POSTERIOR PLANIFICACION DE CARILLAS","B":"SE VALORARA  LA NECESIDAD DE REALIZAR LAS CARIILAS EN PREMOLARES 14/24 DE ACUERDO A LA SONRISA DE LA PACIENTE POST BLANQUEMAIENTO DENTAL"}', 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 138, 2500.00, 1.00, NULL, 2, 5000.00, 0.00, 5000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 177, 5690.00, 1.00, '13-12-11-21-22-23', 6, 34140.00, 0.00, 34140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 177, 5690.00, 1.00, '14-24', 2, 11380.00, 0.00, 11380.00, false);

    -- Paciente 2678 | Fecha: 2022-03-14 | Total: 9210.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2678, 1, '2022-03-14', 9210.00, '{"A":"SE VALORARA DIAGNOSTICO CON TOMOGRAFIA"}', 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 169, 2310.00, 1.00, '13', 1, 2310.00, 0.00, 2310.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2870.00, 1.00, '13', 1, 2870.00, 0.00, 2870.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '13', 1, 1530.00, 0.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 2500.00, 1.00, '13', 1, 2500.00, 0.00, 2500.00, false);

    -- Paciente 2678 | Fecha: 2022-03-23 | Total: 1240.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2678, 1, '2022-03-23', 1240.00, NULL, 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1240.00, 1.00, '24', 1, 1240.00, 0.00, 1240.00, false);

    -- Paciente 2678 | Fecha: 2023-10-12 | Total: 131470.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2678, 1, '2023-10-12', 131470.00, '{"A":"POSIBLE ENDODONCIA EN ELEMENTO DENTARIO 24-27, POR SENSIBILIDAD.\r\nSE SUGIERE IMPLANTE EN SECTOR 3 Y 4 MAXILAR INFERIOR\r\n34-35-44-45 INCRSTACIONES","B":"SE SUGIERE IMPLANTE EN 46 Y 36 \r\nINCRUTACION EN ELEMENTOS DENTARIOS 27 Y 17 POSIBLE ENDODONCIA \r\n24 POSIBLE ENDODONCIA\r\nCORONAS PORCELANA ELEMENTO DENTARIO 13 /11/21\r\nCARILLAS PORCELANA  EN ELEMENTOS DENTARIOS 12/22/23"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 173, 3170.00, 1.00, '17/16', 2, 6340.00, 0.00, 6340.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1100.00, 1.00, '17/16/24', 3, 3300.00, 0.00, 3300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '17/27', 2, 6360.00, 0.00, 6360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 218, 4000.00, 1.00, '16/25/24/13/11/21', 6, 24000.00, 0.00, 24000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 327, 2310.00, 1.00, '14/15', 2, 4620.00, 0.00, 4620.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 311, 4000.00, 1.00, '14/15', 2, 8000.00, 0.00, 8000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '25', 1, 1530.00, 0.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '35/34/33/43/44/45', 6, 6300.00, 0.00, 6300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '32/31/41/42', 4, 2600.00, 0.00, 2600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4000.00, 1.00, '23/22/12', 3, 12000.00, 0.00, 12000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 173, 3170.00, 1.00, '16', 1, 3170.00, 0.00, 3170.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 224, 1100.00, 1.00, '16/24', 2, 2200.00, 0.00, 2200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 218, 4000.00, 1.00, '16/25/24', 3, 12000.00, 0.00, 12000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 327, 2310.00, 1.00, '14/15', 2, 4620.00, 0.00, 4620.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 311, 4000.00, 1.00, '14/15', 2, 8000.00, 0.00, 8000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 121, 1240.00, 1.00, '13/23', 2, 2480.00, 0.00, 2480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1050.00, 1.00, '44/45/43/33/34/35', 6, 6300.00, 0.00, 6300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 650.00, 1.00, '32/31/42/41', 4, 2600.00, 0.00, 2600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1530.00, 1.00, '25', 1, 1530.00, 0.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1400.00, 1.00, NULL, 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 640.00, 1.00, '16', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '11-21', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1100.00, 1.00, '11-21', 2, 2200.00, 0.00, 2200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 218, 4000.00, 1.00, '11-21', 2, 8000.00, 0.00, 8000.00, false);

    -- Paciente 2368 | Fecha: 2019-07-24 | Total: 160300.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2368, 1, '2019-07-24', 160300.00, '{"A":"POSIBILIDAD DE HACER TRATAMIENTO DE CONDUCTOS EN ELEMENTOS DENTARIOS 11/13/22/23/24","B":"POSIBILIDAD DE HACER TRATATMIENTO DE CONDUCTOS EN PZAS 11/13/22/23/24"}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 760.00, 1.00, NULL, 1, 760.00, 0.00, 760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 86, 640.00, 1.00, '11', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 245, 5690.00, 1.00, '11/13/22/23/24', 5, 28450.00, 0.00, 28450.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '12/21', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '12/14/21', 3, 4590.00, 0.00, 4590.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '12/21', 2, 11380.00, 0.00, 11380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 79, 760.00, 1.00, NULL, 1, 760.00, 0.00, 760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 86, 640.00, 1.00, '11', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 245, 5690.00, 1.00, '11/13/22/23/24', 5, 28450.00, 0.00, 28450.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 249, 640.00, 1.00, '12/21/36', 3, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1530.00, 1.00, '12/14/21/36', 4, 6120.00, 0.00, 6120.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5690.00, 1.00, '12/14/21/25/26/45', 6, 34140.00, 0.00, 34140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '48', 1, 3180.00, 0.00, 3180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 640.00, 1.00, '44/43/35/15', 4, 2560.00, 0.00, 2560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '47/38', 2, 2020.00, 0.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '47/38', 2, 14000.00, 0.00, 14000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1750.00, 1.00, '47/38', 2, 3500.00, 0.00, 3500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 4150.00, 1.00, '47/38', 2, 8300.00, 0.00, 8300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '44/43/35', 3, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5690.00, 1.00, '36', 1, 5690.00, 0.00, 5690.00, false);

    -- Paciente 2638 | Fecha: 2021-10-28 | Total: 82160.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2638, 1, '2021-10-28', 82160.00, '{"A":"TRATAMIENTO, \r\n1 PERIODONCIA\r\n2 CARIOLOGIA\r\n3 LESIONES NO CARIOSAS\r\nALT RETIRO 22-23","B":"TRATAMIENTO: REHABILITACION ESTETICA SIN MODIFICAR OCLUSION","C":"TRATAMIENTO:\r\n1. FUNCION: ELEVADO DE MORDIDA, SE DEVUELVE DIMENSION VERTICAL EN ARCADA INFERIOR\r\n2. ESTETICA INFERIOR BLANQUEAMIENTO AMBULATORIO"}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 760.00, 1.00, NULL, 1, 760.00, 0.00, 760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '17-24-26', 3, 1950.00, 0.00, 1950.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '15-16', 2, 2100.00, 0.00, 2100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '33-34-35-36-37', 5, 3250.00, 0.00, 3250.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 131, 770.00, 1.00, NULL, 1, 770.00, 0.00, 770.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 249, 640.00, 1.00, '23-22', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 640.00, 1.00, '23-22', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 245, 5690.00, 1.00, '14-13-12-11-21-24', 6, 34140.00, 0.00, 34140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5690.00, 1.00, '22-23', 2, 11380.00, 0.00, 11380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 345, 1210.00, 1.00, NULL, 1, 1210.00, 0.00, 1210.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 650.00, 1.00, '33-43', 2, 1300.00, 0.00, 1300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 197, 3180.00, 1.00, '37-36-35-34', 4, 12720.00, 0.00, 12720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 197, 3180.00, 1.00, '44-45-46', 3, 3180.00, 0.00, 3180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 123, 1800.00, 1.00, NULL, 1, 1800.00, 0.00, 1800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 347, 1680.00, 1.00, NULL, 1, 1680.00, 0.00, 1680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 347, 1680.00, 1.00, NULL, 1, 1680.00, 0.00, 1680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 347, 1680.00, 1.00, NULL, 1, 1680.00, 0.00, 1680.00, false);

    -- Paciente 2638 | Fecha: 2022-09-07 | Total: 74928.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2638, 1, '2022-09-07', 74928.00, '{"A":"POR MAYOR ESTETICA RECOMENDAMOS CARILLAS DE PORCELANA"}', 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4000.00, 1.00, '33-32-31-41-42-43', 6, 24000.00, 0.00, 24000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '37-36-35-34', 4, 12720.00, 20.00, 10176.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '44-45-46', 3, 9540.00, 20.00, 7632.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3190.00, 1.00, '33-32-31-41-42-43', 6, 19140.00, 20.00, 15312.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '34-35-36-37', 4, 12720.00, 20.00, 10176.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '44-45-46', 3, 9540.00, 20.00, 7632.00, false);

    -- Paciente 2641 | Fecha: 2021-11-11 | Total: 7660.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2641, 1, '2021-11-11', 7660.00, '{"A":"ELEMENTO DENTAL 15 TIENE CORONA METAL PORCELANA, SE HARA REPARACION; LO IDEAL ES CAMBIAR LA CORONA."}', 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 760.00, 1.00, NULL, 1, 760.00, 0.00, 760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '16/14/11/21/25/26', 6, 3900.00, 0.00, 3900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '35/34/44', 3, 1950.00, 0.00, 1950.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '15', 1, 1050.00, 0.00, 1050.00, false);

    -- Paciente 2641 | Fecha: 2022-02-16 | Total: 10400.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2641, 1, '2022-02-16', 10400.00, '{"A":"ELEMENTO DENTAL 38 PRESENTA LESION DE FURCA","B":"ELEMENTO DENTAL 38 PRESENTA LESION DE FURCA"}', 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '38', 1, 3180.00, 0.00, 3180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1530.00, 1.00, '38', 1, 1530.00, 0.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5690.00, 1.00, '38', 1, 5690.00, 0.00, 5690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 1194 | Fecha: 2021-11-24 | Total: 2500.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1194, 1, '2021-11-24', 2500.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 138, 2500.00, 1.00, NULL, 1, 2500.00, 0.00, 2500.00, false);

    -- Paciente 2515 | Fecha: 2021-11-26 | Total: 2500.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2515, 1, '2021-11-26', 2500.00, '{"A":"LA SIGUIENTE PROPUESTA PUEDE TENER ALGUNA MODIFICACIONE AL VALORAR LA PACIENTE, POR FAVOR TENER EN CUENTA"}', 18)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 138, 2500.00, 1.00, NULL, 1, 2500.00, 0.00, 2500.00, false);

    -- Paciente 2463 | Fecha: 2021-11-30 | Total: 44370.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2463, 1, '2021-11-30', 44370.00, '{"A":"SE RECOMIENDA HACER  REHABILITACION TOTAL POR MORDIDA TRAUMATICA, DESGASTE Y DESADAPTACION DE OBTURACIONES OCLUSALES\r\nSE RECOMIENDA HACER CONTROLES PERIODICOS CADA 6 MESES"}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 5690.00, 1.00, '13/12/11/21/22/23', 6, 34140.00, 0.00, 34140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '14/24', 2, 5690.00, 0.00, 5690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 123, 1800.00, 1.00, NULL, 1, 1800.00, 0.00, 1800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1210.00, 1.00, NULL, 1, 1210.00, 0.00, 1210.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '24', 1, 1530.00, 0.00, 1530.00, false);

    -- Paciente 2082 | Fecha: 2022-03-31 | Total: 29540.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2082, 1, '2022-03-31', 29540.00, '{"A":"PRIMERA FASE EXTRACCION DENTAL\r\nSEGUNDA FASE CIRUGIA DE IMPLANTES\r\n SE ESPERAN DOS A TRES MESES","B":"3 MESES POST CIRUGIA SE REALIZAR LA REHABILITACION"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 37, 1280.00, 1.00, '37', 1, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 38, 760.00, 1.00, '35', 1, 760.00, 0.00, 760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '35-36', 2, 14000.00, 0.00, 14000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1750.00, 1.00, '35-36', 2, 3500.00, 0.00, 3500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 5000.00, 1.00, '35-36', 2, 10000.00, 0.00, 10000.00, false);

    -- Paciente 2082 | Fecha: 2023-01-03 | Total: 62050.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2082, 1, '2023-01-03', 62050.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '47', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 325, 1400.00, 1.00, '41/43', 2, 2800.00, 0.00, 2800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '31/42/45/35', 4, 28000.00, 0.00, 28000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 323, 21000.00, 1.00, NULL, 1, 21000.00, 0.00, 21000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 327, 2310.00, 1.00, '31/42/45/35', 4, 9240.00, 0.00, 9240.00, false);

    -- Paciente 2593 | Fecha: 2022-02-15 | Total: 41570.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2593, 1, '2022-02-15', 41570.00, '{"B":"SE RECOMIENDA REALIZAR TRATAMIENTO DE CONDUCTOS POR PROXIMIDAD AL NERVIO Y RETRATAMIENTO DE CONDUCTO"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 2470.00, 1.00, '22', 1, 2470.00, 0.00, 2470.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2870.00, 1.00, '11', 1, 2870.00, 0.00, 2870.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '22-11', 2, 3060.00, 0.00, 3060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '22-11', 2, 11380.00, 0.00, 11380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 245, 5690.00, 1.00, '22', 1, 5690.00, 0.00, 5690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5690.00, 1.00, '11', 1, 5690.00, 0.00, 5690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 115, 3190.00, 1.00, '22', 1, 3190.00, 0.00, 3190.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 380, 5690.00, 1.00, '11', 1, 5690.00, 0.00, 5690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1530.00, 1.00, '11', 1, 1530.00, 0.00, 1530.00, false);

    -- Paciente 277 | Fecha: 2022-04-12 | Total: 8160.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (277, 1, '2022-04-12', 8160.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 202, 10200.00, 1.00, NULL, 1, 10200.00, 20.00, 8160.00, false);

    -- Paciente 2597 | Fecha: 2022-04-18 | Total: 1000.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2597, 1, '2022-04-18', 1000.00, NULL, 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 381, 350.00, 1.00, '25', 1, 350.00, 0.00, 350.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '37', 1, 650.00, 0.00, 650.00, false);

    -- Paciente 2686 | Fecha: 2022-04-20 | Total: 4790.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2686, 1, '2022-04-20', 4790.00, NULL, 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1210.00, 1.00, NULL, 1, 1210.00, 0.00, 1210.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 283, 510.00, 1.00, '17/27/37', 3, 1530.00, 0.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '47', 1, 650.00, 0.00, 650.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 381, 350.00, 1.00, '36/46/26/16', 4, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 1684 | Fecha: 2016-10-25 | Total: 68980.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1684, 1, '2016-10-25', 68980.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '16/26/27/36/37/46', 6, 5520.00, 0.00, 5520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '14/15/24/25/34/35', 6, 17340.00, 0.00, 17340.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '44/45', 2, 5780.00, 0.00, 5780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 8110.00, 1.00, '21', 1, 8110.00, 0.00, 8110.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2900.00, 1.00, '21', 1, 2900.00, 0.00, 2900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 311, 4900.00, 1.00, '21', 1, 4900.00, 0.00, 4900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '12/32/42', 3, 2760.00, 0.00, 2760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 580.00, 1.00, '11', 1, 580.00, 0.00, 580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2550.00, 1.00, '11', 1, 2550.00, 0.00, 2550.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 580.00, 1.00, '11/22', 2, 1160.00, 0.00, 1160.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2550.00, 1.00, '11', 1, 2550.00, 0.00, 2550.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '11/22', 2, 2780.00, 0.00, 2780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5170.00, 1.00, '22', 1, 5170.00, 0.00, 5170.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 86, 580.00, 1.00, '11', 1, 580.00, 0.00, 580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 114, 1730.00, 1.00, '33/43', 2, 3460.00, 0.00, 3460.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 580.00, 1.00, '11/21/22', 3, 1740.00, 0.00, 1740.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1100.00, 1.00, NULL, 1, 1100.00, 0.00, 1100.00, false);

    -- Paciente 1684 | Fecha: 2017-02-15 | Total: 33595.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1684, 1, '2017-02-15', 33595.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 920.00, 1.00, '26/27', 2, 1840.00, 15.00, 1564.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 309, 1750.00, 1.00, '26/27', 1, 1750.00, 0.00, 1750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 82, 3480.00, 1.00, '26/27', 1, 3480.00, 0.00, 3480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 305, 7000.00, 1.00, '26/27', 2, 14000.00, 0.00, 14000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2900.00, 1.00, '26/27', 2, 5800.00, 15.00, 4930.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4630.00, 1.00, '26/27', 2, 9260.00, 15.00, 7871.00, false);

    -- Paciente 1684 | Fecha: 2017-11-13 | Total: 62628.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1684, 1, '2017-11-13', 62628.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 114, 1900.00, 1.00, '33-32-31-41-42-43', 6, 11400.00, 18.00, 9348.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 177, 5690.00, 1.00, '33-32-31-41-42-43', 6, 34140.00, 0.00, 34140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 115, 3190.00, 1.00, '33-32-31-41-42-43', 6, 19140.00, 0.00, 19140.00, false);

    -- Paciente 260 | Fecha: 2016-11-09 | Total: 52545.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (260, 1, '2016-11-09', 52545.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2900.00, 1.00, '31/32/34/43/44', 5, 14500.00, 25.00, 10875.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4630.00, 1.00, '31/32/33/34/35/36', 6, 27780.00, 25.00, 20835.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4630.00, 1.00, '41/42/43/44/45/46', 6, 27780.00, 25.00, 20835.00, false);

    -- Paciente 1420 | Fecha: 2016-11-25 | Total: 2900.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1420, 1, '2016-11-25', 2900.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 580.00, 1.00, NULL, 1, 580.00, 0.00, 580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 239, 2320.00, 1.00, NULL, 1, 2320.00, 0.00, 2320.00, false);

    -- Paciente 395 | Fecha: 2016-12-01 | Total: 19550.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (395, 1, '2016-12-01', 19550.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 690.00, 1.00, NULL, 1, 690.00, 0.00, 690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '14/42/43/44/45', 5, 2900.00, 0.00, 2900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '35', 1, 2890.00, 0.00, 2890.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 381, 190.00, 1.00, '13/12/11/21', 4, 760.00, 0.00, 760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5170.00, 1.00, '25/36', 2, 10340.00, 0.00, 10340.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '36', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 580.00, 1.00, '36', 1, 580.00, 0.00, 580.00, false);

    -- Paciente 395 | Fecha: 2018-08-17 | Total: 179540.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (395, 1, '2018-08-17', 179540.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '17/15/14/24/37/35', 6, 19080.00, 0.00, 19080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '34/44/45/47', 4, 12720.00, 0.00, 12720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 3190.00, 1.00, '13/12/11/21/22/23', 6, 19140.00, 0.00, 19140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '13/12/11/21/22/23', 6, 6060.00, 0.00, 6060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 3190.00, 1.00, '33/32/31/41/42/43', 6, 19140.00, 0.00, 19140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '25/26/46/36', 4, 22760.00, 0.00, 22760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '17/15/14/24/34/44', 6, 19080.00, 0.00, 19080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3190.00, 1.00, '13/12/11/21/22/23', 6, 19140.00, 0.00, 19140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1010.00, 1.00, '23/11/12', 3, 3030.00, 0.00, 3030.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5690.00, 1.00, '26/36/46', 3, 17070.00, 0.00, 17070.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3190.00, 1.00, '33/32/31/41/42/43', 6, 19140.00, 0.00, 19140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '45', 1, 3180.00, 0.00, 3180.00, false);

    -- Paciente 395 | Fecha: 2021-06-25 | Total: 98810.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (395, 1, '2021-06-25', 98810.00, NULL, 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '17/15/14/24', 4, 12720.00, 0.00, 12720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '25/26/36', 3, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '25/26', 2, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '25/26', 2, 11380.00, 0.00, 11380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '37/35//34', 3, 9540.00, 0.00, 9540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '47/45/44', 3, 9540.00, 0.00, 9540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 2500.00, 1.00, '46/36', 2, 5000.00, 0.00, 5000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3190.00, 1.00, '13/12/11', 3, 3190.00, 0.00, 3190.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3190.00, 1.00, '21/22/23', 3, 3190.00, 0.00, 3190.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3190.00, 1.00, '33/32/31', 3, 9570.00, 0.00, 9570.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3190.00, 1.00, '41/42/43', 3, 9570.00, 0.00, 9570.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 115, 3190.00, 1.00, '13/12/11', 3, 9570.00, 0.00, 9570.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 115, 3190.00, 1.00, '21/22/23', 3, 9570.00, 0.00, 9570.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 345, 1210.00, 1.00, NULL, 1, 1210.00, 0.00, 1210.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1100.00, 1.00, '25/26', 2, 2200.00, 0.00, 2200.00, false);

    -- Paciente 261 | Fecha: 2019-06-11 | Total: 7712.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (261, 1, '2019-06-11', 7712.00, NULL, 13)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3950.00, 1.00, '14', 1, 3950.00, 20.00, 3160.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '14', 1, 5690.00, 20.00, 4552.00, false);

    -- Paciente 464 | Fecha: 2019-06-11 | Total: 53830.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (464, 1, '2019-06-11', 53830.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '17/16/15/44', 4, 2560.00, 0.00, 2560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 970.00, 1.00, '17/16/15', 3, 2910.00, 0.00, 2910.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '13/23', 3, 3030.00, 0.00, 3030.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '12/11/21/22', 4, 2560.00, 0.00, 2560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '34/35/', 2, 6360.00, 0.00, 6360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '33/32/31/41/42/43', 6, 6060.00, 0.00, 6060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '44/45/17/16/15', 5, 28450.00, 0.00, 28450.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 203, 1900.00, 1.00, NULL, 1, 1900.00, 0.00, 1900.00, false);

    -- Paciente 66 | Fecha: 2016-12-02 | Total: 83380.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (66, 1, '2016-12-02', 83380.00, '{"A":"XXXXXX"}', 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 920.00, 1.00, '13/14', 2, 1840.00, 0.00, 1840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 8110.00, 1.00, '13/14/22/23', 4, 32440.00, 0.00, 32440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 221, 2760.00, 1.00, NULL, 1, 2760.00, 0.00, 2760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 382, 10150.00, 1.00, NULL, 1, 10150.00, 0.00, 10150.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5170.00, 1.00, NULL, 6, 31020.00, 0.00, 31020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5170.00, 1.00, NULL, 1, 5170.00, 0.00, 5170.00, false);

    -- Paciente 66 | Fecha: 2016-12-02 | Total: 114930.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (66, 1, '2016-12-02', 114930.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 920.00, 1.00, '13/14/15/17/24', 5, 4600.00, 0.00, 4600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 8110.00, 1.00, '13/14/15/22/23', 5, 40550.00, 0.00, 40550.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 221, 2760.00, 1.00, NULL, 1, 2760.00, 0.00, 2760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 382, 10150.00, 1.00, NULL, 1, 10150.00, 0.00, 10150.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5170.00, 1.00, NULL, 6, 31020.00, 0.00, 31020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5170.00, 1.00, NULL, 5, 25850.00, 0.00, 25850.00, false);

    -- Paciente 531 | Fecha: 2019-03-25 | Total: 57660.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (531, 1, '2019-03-25', 57660.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 5690.00, 1.00, '12-11-21-22', 4, 22760.00, 0.00, 22760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '13-23-33-43', 4, 4040.00, 0.00, 4040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 177, 5690.00, 1.00, '12-22', 2, 11380.00, 0.00, 11380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1010.00, 1.00, '13-23-33-43', 4, 4040.00, 0.00, 4040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 114, 1900.00, 1.00, '11-21', 2, 3800.00, 0.00, 3800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 114, 1900.00, 1.00, '12-11-21-22', 4, 7600.00, 0.00, 7600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 117, 1010.00, 1.00, '13-23-33-43', 4, 4040.00, 0.00, 4040.00, false);

    -- Paciente 2604 | Fecha: 2023-01-06 | Total: 72420.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2604, 1, '2023-01-06', 72420.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '44-45-34-35', 4, 12720.00, 0.00, 12720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '46-47', 2, 14000.00, 0.00, 14000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1400.00, 1.00, '46-47', 2, 2800.00, 0.00, 2800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 311, 4000.00, 1.00, '46-47', 2, 8000.00, 0.00, 8000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 161, 2870.00, 1.00, '17-16', 2, 5740.00, 0.00, 5740.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '17-16', 2, 6360.00, 0.00, 6360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '46-47', 2, 14000.00, 0.00, 14000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1400.00, 1.00, '46-47', 2, 2800.00, 0.00, 2800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 301, 3000.00, 1.00, '46-47', 2, 6000.00, 0.00, 6000.00, false);

    -- Paciente 96 | Fecha: 2023-01-16 | Total: 8400.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (96, 1, '2023-01-16', 8400.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4000.00, 1.00, '12-21-22', 3, 12000.00, 30.00, 8400.00, false);

    -- Paciente 1082 | Fecha: 2023-01-25 | Total: 10405.80
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1082, 1, '2023-01-25', 10405.80, '{"A":"EXISTE LA POSIBILIDAD DE TRATAMIENTO DE CONDUCTO EN PZAS.26,46 Y 47","B":"EXISTE LA POSIBILIDAD TC 26/46/47.SE INDICA INCRUSTACIONES POR AJUSTE EN ESTRUCTURA DENTAL"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '46/47/26', 3, 3150.00, 18.00, 2583.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '26/46/47', 3, 9540.00, 18.00, 7822.80, false);

    -- Paciente 2763 | Fecha: 2023-01-26 | Total: 16060.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2763, 1, '2023-01-26', 16060.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 3470.00, 1.00, '27', 1, 3470.00, 0.00, 3470.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '27', 1, 3180.00, 0.00, 3180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '27', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '27', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 35, 1400.00, 1.00, '28', 1, 1400.00, 0.00, 1400.00, false);

    -- Paciente 2763 | Fecha: 2023-01-26 | Total: 20660.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2763, 1, '2023-01-26', 20660.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 3470.00, 1.00, '27', 1, 3470.00, 0.00, 3470.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '27', 1, 3180.00, 0.00, 3180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '27', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '27', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1400.00, 1.00, '27', 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 3200.00, 1.00, '27', 1, 3200.00, 0.00, 3200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 35, 1400.00, 1.00, '28', 1, 1400.00, 0.00, 1400.00, false);

    -- Paciente 2049 | Fecha: 2017-11-01 | Total: 88970.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2049, 1, '2017-11-01', 88970.00, '{"A":"ESTE PLAN DE TRABAJO SERA EXPLICADO DE MANERA VERBAL Y DEMOSTRATIVO CON MODELOS DE ESTUDIO,SU SALUD DENTAL ES NUESTRA RESPONSABILIDAD.\r\nORTODONCIA: EXISTE LA POSIBILIDAD DE HACER INTERCONSULTA CON ESPECIALISTA"}', 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 238, 1520.00, 1.00, NULL, 1, 1520.00, 0.00, 1520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '14/15/16/17', 4, 12720.00, 0.00, 12720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '11/12/13/21/22/23', 6, 19080.00, 0.00, 19080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '24/25/26', 3, 9540.00, 0.00, 9540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '27', 1, 3180.00, 0.00, 3180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '36/46/47', 3, 9540.00, 0.00, 9540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '34/35/44/45', 4, 2560.00, 0.00, 2560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '33/43', 2, 2020.00, 0.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '27', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 8000.00, 1.00, '27/37', 2, 16000.00, 0.00, 16000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1750.00, 1.00, '27/37', 2, 3500.00, 0.00, 3500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 4150.00, 1.00, '27/37', 2, 8300.00, 0.00, 8300.00, false);

    -- Paciente 1122 | Fecha: 2022-06-14 | Total: 35110.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1122, 1, '2022-06-14', 35110.00, NULL, 12)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '15', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '15', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 239, 2550.00, 1.00, '15', 1, 2550.00, 0.00, 2550.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '15', 1, 1750.00, 0.00, 1750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 5000.00, 1.00, '15', 1, 5000.00, 0.00, 5000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 24, 200.00, 1.00, '15', 1, 200.00, 0.00, 200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 310, 650.00, 1.00, '15', 1, 650.00, 0.00, 650.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '15', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '15', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 321, 700.00, 1.00, '15', 1, 700.00, 0.00, 700.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 640.00, 1.00, '15', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 24, 200.00, 1.00, '15', 1, 200.00, 0.00, 200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 310, 650.00, 1.00, '15', 1, 650.00, 0.00, 650.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1750.00, 1.00, '15', 1, 1750.00, 0.00, 1750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 5000.00, 1.00, '15', 1, 5000.00, 0.00, 5000.00, false);

    -- Paciente 1122 | Fecha: 2023-08-31 | Total: 41280.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1122, 1, '2023-08-31', 41280.00, '{"A":"EXISTE LA POSIBILIDAD DE REALIZAR TRATAMIENTO DE ENDODONCIA EN CASO DE HIPERSENSIBILIDAD"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4000.00, 1.00, '14-13-12-11', 4, 16000.00, 0.00, 16000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 177, 4000.00, 1.00, '14-13-12-11', 4, 16000.00, 0.00, 16000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 249, 640.00, 1.00, '21-22', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 218, 4000.00, 1.00, '21-22', 2, 8000.00, 0.00, 8000.00, false);

    -- Paciente 1122 | Fecha: 2024-11-08 | Total: 65340.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1122, 1, '2024-11-08', 65340.00, '{"A":"PLANDE TRATAMIENTODE TODO EL SECTOR ANTERIOR SUPERIOR E INFERIOR","B":"PLAN DE TRATAMIENTO TODO EL SECTOR ANTERIOR SUPERIOR E INFERIOR"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '21/22/23', 3, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4000.00, 1.00, '13/12/11', 3, 12000.00, 0.00, 12000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 218, 4000.00, 1.00, '21/22/23', 3, 12000.00, 0.00, 12000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1240.00, 1.00, '14/24', 2, 2480.00, 0.00, 2480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '33/32/31/41/42/43', 6, 6300.00, 0.00, 6300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 177, 4000.00, 1.00, '12/11/13', 3, 12000.00, 0.00, 12000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 121, 1240.00, 1.00, '14/24', 2, 2480.00, 0.00, 2480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 276, 1280.00, 1.00, '21/22/23', 3, 3840.00, 0.00, 3840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1050.00, 1.00, '33/32/31/41/42/43', 6, 6300.00, 0.00, 6300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 117, 1050.00, 1.00, '34/44/45/15/35', 5, 5250.00, 0.00, 5250.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 131, 770.00, 1.00, NULL, 1, 770.00, 0.00, 770.00, false);

    -- Paciente 1418 | Fecha: 2022-06-30 | Total: 91370.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1418, 1, '2022-06-30', 91370.00, '{"A":"REQUIERE EXTRACCIONES POR PRESENTAR INFECCION EN RAICES Y RESTOS RADICULARES.","B":"EL PRESENTE TRATAMIENTO ESTA ORIENTADO A REHABILITACION TOTAL SUPERIOR Y PARCIAL INFERIOR"}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 76, 520.00, 1.00, '13/12/11/21/22', 5, 2600.00, 0.00, 2600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 76, 520.00, 1.00, '45/44/43/42', 4, 2080.00, 0.00, 2080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '13/12/11/21/22/23', 6, 6060.00, 0.00, 6060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '24/34/33/46/47', 5, 5050.00, 0.00, 5050.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 239, 2550.00, 1.00, NULL, 2, 5100.00, 0.00, 5100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '13/12/11/22/23', 5, 35000.00, 0.00, 35000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 323, 21000.00, 1.00, NULL, 1, 21000.00, 0.00, 21000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1050.00, 1.00, '44', 1, 1050.00, 0.00, 1050.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 235, 640.00, 1.00, NULL, 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '34-33-46-47', 4, 4040.00, 0.00, 4040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1750.00, 1.00, '13/12/11/22/23', 5, 8750.00, 0.00, 8750.00, false);

    -- Paciente 2689 | Fecha: 2022-07-04 | Total: 22960.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2689, 1, '2022-07-04', 22960.00, NULL, 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 145, 1800.00, 1.00, NULL, 1, 1800.00, 0.00, 1800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 135, 2100.00, 1.00, '12-11-21-22', 4, 8400.00, 0.00, 8400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 115, 3190.00, 1.00, '12-11-21-22', 4, 12760.00, 0.00, 12760.00, false);

    -- Paciente 2689 | Fecha: 2026-04-22 | Total: 14600.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2689, 1, '2026-04-22', 14600.00, '{"A":"SE VALORARA LA NECESIDAD DE REALIZAR OBTURACIONES SIMPLES 13-23 BS. 800.- C/U"}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1850.00, 1.00, '12-11-21-22', 4, 7400.00, 0.00, 7400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1200.00, 1.00, '33-32-31-41-42-43', 6, 7200.00, 0.00, 7200.00, false);

    -- Paciente 1850 | Fecha: 2016-09-28 | Total: 72670.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1850, 1, '2016-09-28', 72670.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 237, 2430.00, 1.00, NULL, 1, 2430.00, 0.00, 2430.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '17/16/15/14/24/25', 6, 17340.00, 0.00, 17340.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '26/27/34/35/36/37', 6, 17340.00, 0.00, 17340.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '44/45/46/47', 4, 11560.00, 0.00, 11560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 92, 2320.00, 1.00, '21/22/23/24/14/25', 1, 2320.00, 0.00, 2320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '13/23/12/22', 4, 2320.00, 0.00, 2320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '32/31/41/42', 4, 2320.00, 0.00, 2320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 920.00, 1.00, '17/16/15/14/24/25', 6, 5520.00, 0.00, 5520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 920.00, 1.00, '26/27/34/35/36/37', 6, 5520.00, 0.00, 5520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 920.00, 1.00, '44/45/46/47', 4, 3680.00, 0.00, 3680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 580.00, 1.00, '13/12/22/23', 4, 2320.00, 0.00, 2320.00, false);

    -- Paciente 1873 | Fecha: 2016-10-10 | Total: 83100.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1873, 1, '2016-10-10', 83100.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 920.00, 1.00, '41-42-31', 3, 2760.00, 0.00, 2760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 8110.00, 1.00, '32-34-42-44', 4, 32440.00, 0.00, 32440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 82, 3480.00, 1.00, '32-34-42-44', 1, 3480.00, 0.00, 3480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 227, 2310.00, 1.00, NULL, 1, 2310.00, 0.00, 2310.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2900.00, 1.00, '32-34-42-44', 4, 11600.00, 0.00, 11600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 295, 4140.00, 1.00, NULL, 1, 4140.00, 0.00, 4140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 382, 10150.00, 1.00, NULL, 1, 10150.00, 0.00, 10150.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 212, 7530.00, 1.00, NULL, 1, 7530.00, 0.00, 7530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 214, 8690.00, 1.00, NULL, 1, 8690.00, 0.00, 8690.00, false);

    -- Paciente 1833 | Fecha: 2016-10-12 | Total: 3248.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1833, 1, '2016-10-12', 3248.00, NULL, 7)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 92, 2320.00, 1.00, '13-12-11-21-22-23', 1, 2320.00, 30.00, 1624.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 92, 2320.00, 1.00, '33-32-31-41-42-43', 1, 2320.00, 30.00, 1624.00, false);

    -- Paciente 327 | Fecha: 2015-12-28 | Total: 3200.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (327, 1, '2015-12-28', 3200.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 111, 1600.00, 1.00, NULL, 2, 3200.00, 0.00, 3200.00, false);

    -- Paciente 1742 | Fecha: 2016-02-10 | Total: 1790.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1742, 1, '2016-02-10', 1790.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1100.00, 1.00, NULL, 1, 1100.00, 0.00, 1100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 690.00, 1.00, NULL, 1, 690.00, 0.00, 690.00, false);

    -- Paciente 1756 | Fecha: 2016-03-18 | Total: 137900.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1756, 1, '2016-03-18', 137900.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '13/12/11/21/22/23', 6, 5520.00, 0.00, 5520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '33/32/31/41/42/43', 6, 5520.00, 0.00, 5520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '48/44/38/34', 4, 11560.00, 0.00, 11560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 2210.00, 1.00, '44', 1, 2210.00, 0.00, 2210.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 3010.00, 1.00, '46', 1, 3010.00, 0.00, 3010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 580.00, 1.00, '46', 1, 580.00, 0.00, 580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 920.00, 1.00, '46', 1, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '46', 1, 4400.00, 0.00, 4400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 162, 2210.00, 1.00, '13/23/44', 3, 6630.00, 0.00, 6630.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 161, 2440.00, 1.00, '17', 1, 2440.00, 0.00, 2440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 158, 3010.00, 1.00, '46', 1, 3010.00, 0.00, 3010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 210, 580.00, 1.00, '46/17', 2, 1160.00, 0.00, 1160.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1390.00, 1.00, '13/23', 2, 2780.00, 0.00, 2780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 224, 920.00, 1.00, '46/17', 2, 1840.00, 0.00, 1840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 2890.00, 1.00, '38/48/34/44', 4, 11560.00, 0.00, 11560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 920.00, 1.00, '43/33/11/12/21/22', 6, 5520.00, 0.00, 5520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 580.00, 1.00, '32/31/41/42', 4, 2320.00, 0.00, 2320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 4400.00, 1.00, '17/46', 2, 8800.00, 0.00, 8800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 292, 8110.00, 1.00, NULL, 1, 8110.00, 0.00, 8110.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 294, 4630.00, 1.00, NULL, 1, 4630.00, 0.00, 4630.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 293, 2900.00, 1.00, NULL, 1, 2900.00, 0.00, 2900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 230, 5310.00, 1.00, '13/23', 2, 10620.00, 0.00, 10620.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 213, 9270.00, 1.00, NULL, 1, 9270.00, 0.00, 9270.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 212, 7530.00, 1.00, NULL, 2, 15060.00, 0.00, 15060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 212, 7530.00, 1.00, NULL, 1, 7530.00, 0.00, 7530.00, false);

    -- Paciente 1235 | Fecha: 2016-04-12 | Total: 11060.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1235, 1, '2016-04-12', 11060.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 690.00, 1.00, NULL, 1, 690.00, 0.00, 690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1100.00, 1.00, NULL, 1, 1100.00, 0.00, 1100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '17-15-47', 3, 1740.00, 0.00, 1740.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '13-35-34-45', 4, 3680.00, 0.00, 3680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '36', 1, 2890.00, 0.00, 2890.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 164, 960.00, 1.00, '36', 1, 960.00, 0.00, 960.00, false);

    -- Paciente 1667 | Fecha: 2015-11-19 | Total: 78080.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1667, 1, '2015-11-19', 78080.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 111, 1600.00, 1.00, NULL, 2, 3200.00, 0.00, 3200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '17/16/14/24/26/27', 6, 17340.00, 0.00, 17340.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '37/36/35/34', 4, 11560.00, 0.00, 11560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '44/45/46/47', 4, 11560.00, 0.00, 11560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 920.00, 1.00, '15/25/27', 3, 2760.00, 0.00, 2760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 218, 4870.00, 1.00, '15/25', 2, 4870.00, 0.00, 4870.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2550.00, 1.00, '13', 1, 2550.00, 0.00, 2550.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '13', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 218, 4870.00, 1.00, '13', 1, 4870.00, 0.00, 4870.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 3480.00, 1.00, '12/11/21/22/23', 5, 17400.00, 0.00, 17400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 86, 580.00, 1.00, '11/12/13/22/25', 1, 580.00, 0.00, 580.00, false);

    -- Paciente 1667 | Fecha: 2016-04-13 | Total: 64320.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1667, 1, '2016-04-13', 64320.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 245, 5170.00, 1.00, '33/32/31/41/42/43', 6, 31020.00, 0.00, 31020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 114, 1730.00, 1.00, '33/32/31/41/42/43', 6, 10380.00, 0.00, 10380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 115, 2900.00, 1.00, '33/32/31/41/42/43', 6, 17400.00, 0.00, 17400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 117, 920.00, 1.00, '33/32/31/41/42/43', 6, 5520.00, 0.00, 5520.00, false);

    -- Paciente 1667 | Fecha: 2016-04-13 | Total: 17400.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1667, 1, '2016-04-13', 17400.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 115, 2900.00, 1.00, '33/32/31/41/42/43', 6, 17400.00, 0.00, 17400.00, false);

    -- Paciente 1667 | Fecha: 2022-02-11 | Total: 31060.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1667, 1, '2022-02-11', 31060.00, '{"A":"TRATAMIENTO SUPERIOR PARA  LAS CARILLAS DE LOS PREMOLARES CON  RESINA ESTETICA DE LABORATORIO\r\nTRATAMIENTO EN SECTOR INFERIOR CAMBIO DE OBTURACIONES","B":"TRATAMIENTO PARA CAMBIAR OBTURACIONES DE PREMOLARES SUPERIORES POR CARILLAS DEL MISMO MATERIAL QUE LOS DIENTES ANTERO SUPERIOR\r\nTRATAMIENTO EN SECTOR ANTERO INFERIOR CAMBIO DE OBTURACIONES","C":"PARA EVITAR EMPAQUETAMIENTO DE ALIMENTOS SE RECOMIENDA INCRUSTACIONES PARA CIERRE DE ESPACIOS INTERDENTALES."}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '31-41-42', 3, 3150.00, 0.00, 3150.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 3190.00, 1.00, '14-24', 2, 6380.00, 0.00, 6380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1050.00, 1.00, '31-41-42', 3, 3150.00, 0.00, 3150.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 245, 5690.00, 1.00, '14-24', 2, 11380.00, 0.00, 11380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 197, 3500.00, 1.00, NULL, 2, 7000.00, 0.00, 7000.00, false);

    -- Paciente 1667 | Fecha: 2026-06-03 | Total: 28652.50
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1667, 1, '2026-06-03', 28652.50, NULL, 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 850.00, 1.00, NULL, 1, 850.00, 15.00, 722.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 4000.00, 1.00, '17/16/26/27/37/46', 6, 24000.00, 5.00, 22800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 5400.00, 1.00, '27', 1, 5400.00, 5.00, 5130.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1200.00, 1.00, '36/45/47/', 3, 3600.00, 100.00, 0.00, false);

    -- Paciente 1694 | Fecha: 2016-04-28 | Total: 108280.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1694, 1, '2016-04-28', 108280.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '17/16/15/14', 4, 11560.00, 0.00, 11560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '24/25/26/27', 4, 11560.00, 0.00, 11560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '34/35/36/37', 4, 11560.00, 0.00, 11560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '44/45/46/47', 4, 11560.00, 0.00, 11560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5170.00, 1.00, '13/12/11/21/22/23', 6, 31020.00, 0.00, 31020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5170.00, 1.00, '33/32/31/41/42/43', 6, 31020.00, 0.00, 31020.00, false);

    -- Paciente 1772 | Fecha: 2016-05-03 | Total: 5520.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1772, 1, '2016-05-03', 5520.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '37/36/35/45/46/47', 6, 5520.00, 0.00, 5520.00, false);

    -- Paciente 992 | Fecha: 2016-05-10 | Total: 40783.50
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (992, 1, '2016-05-10', 40783.50, NULL, 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 690.00, 1.00, NULL, 1, 690.00, 0.00, 690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '17/16/26/27/36', 5, 14450.00, 0.00, 14450.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '37/46', 2, 5780.00, 0.00, 5780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '13/23', 2, 1160.00, 0.00, 1160.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '14/24/34/35/44/45', 6, 5520.00, 0.00, 5520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5170.00, 1.00, '15/25/47', 3, 15510.00, 15.00, 13183.50, false);

    -- Paciente 477 | Fecha: 2022-11-09 | Total: 3940.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (477, 1, '2022-11-09', 3940.00, NULL, 21)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 165, 760.00, 1.00, '26', 1, 760.00, 0.00, 760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '26', 1, 3180.00, 0.00, 3180.00, false);

    -- Paciente 2747 | Fecha: 2022-11-09 | Total: 3940.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2747, 1, '2022-11-09', 3940.00, '{"A":"EXISTE POSIBILIDAD DE REALIZAR TRATAMIENTO DE CONDUCTOS POR CERCABNIA A PULPA DENTAL (2870 BS)"}', 21)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 165, 760.00, 1.00, '26', 1, 760.00, 0.00, 760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '26', 1, 3180.00, 0.00, 3180.00, false);

    -- Paciente 2691 | Fecha: 2022-11-16 | Total: 7500.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2691, 1, '2022-11-16', 7500.00, NULL, 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 254, 4500.00, 1.00, NULL, 1, 4500.00, 0.00, 4500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 253, 3000.00, 1.00, '35-36-37', 1, 3000.00, 0.00, 3000.00, false);

    -- Paciente 78 | Fecha: 2022-11-25 | Total: 31290.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (78, 1, '2022-11-25', 31290.00, '{"A":"DE ACUERDO AL ENCERADO FUNCIONAL Y ESTETICO SE REALIZARA UNA EVALUACION SI ES NECESARIO COMPLEMENTAR TRATAMIENTO CON ELEVADO DE MORDIDA POR OLCUSION TRAUMATICA Y FALTA DE CANINO SUPERIOR"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 131, 770.00, 1.00, '11-21', 1, 770.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 5690.00, 1.00, '11/21', 2, 11380.00, 0.00, 11380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 131, 770.00, 1.00, '14-12-11-21-22-23', 1, 770.00, 0.00, 770.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3190.00, 1.00, '14-12-11-21-22-23', 6, 19140.00, 0.00, 19140.00, false);

    -- Paciente 2258 | Fecha: 2022-12-05 | Total: 4000.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2258, 1, '2022-12-05', 4000.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 111, 2000.00, 1.00, NULL, 2, 4000.00, 0.00, 4000.00, false);

    -- Paciente 1918 | Fecha: 2017-01-19 | Total: 57430.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1918, 1, '2017-01-19', 57430.00, NULL, 7)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 245, 5170.00, 1.00, '12-11-21', 3, 15510.00, 0.00, 15510.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 114, 1730.00, 1.00, '12-11-21', 3, 5190.00, 0.00, 5190.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 32, 3310.00, 1.00, '22', 1, 3310.00, 0.00, 3310.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5170.00, 1.00, '22', 1, 5170.00, 0.00, 5170.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 580.00, 1.00, '25-26-27', 3, 1740.00, 0.00, 1740.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '25-27', 2, 2780.00, 0.00, 2780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '25-26-27', 3, 13200.00, 0.00, 13200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 920.00, 1.00, '45', 1, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '46', 1, 4400.00, 0.00, 4400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 215, 5210.00, 1.00, '45-46', 1, 5210.00, 0.00, 5210.00, false);

    -- Paciente 1887 | Fecha: 2017-01-10 | Total: 7620.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1887, 1, '2017-01-10', 7620.00, NULL, 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '45/46', 2, 5780.00, 0.00, 5780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '45/46', 2, 1840.00, 0.00, 1840.00, false);

    -- Paciente 1887 | Fecha: 2017-01-18 | Total: 34410.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1887, 1, '2017-01-18', 34410.00, '{"A":"ARCADA SUPERIOR: CUADRANTE 1 (ARRIBA A LA DERECHA)\r\nLOS POSIBLES TRATAMIENTOS DE LOS ELEMENTOS DENTALES 14/15/16 SE DEFINIRAN DESPUES DE LA RADIOGRAFIA.","B":"ARCADA SUPERIOR: CUADRANTE 2 (ARRIBA LADO IZQUIERDO)\r\nEL TRATAMIENTO DEL ELEMENTO DENTAL 26 SE DEFINIRA DESPUES DE LA RADIOGRAFIA","C":"ARCADA INFERIOR: CUADRANTE 3 (ABAJO LADO IZQUIERDO)\r\nPOSIBLES  TRATAMIENTOS DE LOS ELEMENTOS DENTARIOS: 37/38: TRATAMEINTO DE CONDUCTOS MULTIRADICULAR.\r\nESTOS POSIBLES TRATAMIENTOS SE DEFINIRAN DESPUES DE LA RADIOGRAFIA Y DURANTE EL TRATAMIENTO CLINICO.","D":"POSIBLES SUGERENCIAS: \r\n-EL AJUSTEDE OCLUSION  SOLO SE REALIZARA DE SER NECESARIA AL FINALIZAR TODO EL TRATAMIENTO.\r\n-PLACA DE RELAJAMIENTO"}', 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 9, 70.00, 1.00, '14', 1, 70.00, 0.00, 70.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '17', 1, 2890.00, 0.00, 2890.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 35, 1270.00, 1.00, '18', 1, 1270.00, 0.00, 1270.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 920.00, 1.00, '24', 1, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 224, 920.00, 1.00, '25', 1, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 4400.00, 1.00, '25', 1, 4400.00, 0.00, 4400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 580.00, 1.00, '27', 1, 580.00, 0.00, 580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 9, 70.00, 1.00, '26', 1, 70.00, 0.00, 70.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 9, 70.00, 1.00, '36/37', 1, 70.00, 0.00, 70.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 158, 3010.00, 1.00, '36', 1, 3010.00, 0.00, 3010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 201, 1390.00, 1.00, '36', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 185, 4400.00, 1.00, '36', 1, 4400.00, 0.00, 4400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 165, 690.00, 1.00, '37', 1, 690.00, 0.00, 690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 197, 2890.00, 1.00, '37', 1, 2890.00, 0.00, 2890.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 165, 690.00, 1.00, '38', 1, 690.00, 0.00, 690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 197, 2890.00, 1.00, '38', 1, 2890.00, 0.00, 2890.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 271, 1930.00, 1.00, NULL, 1, 1930.00, 0.00, 1930.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 111, 1800.00, 1.00, NULL, 2, 3600.00, 0.00, 3600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 203, 1730.00, 1.00, NULL, 1, 1730.00, 0.00, 1730.00, false);

    -- Paciente 1754 | Fecha: 2017-01-30 | Total: 16630.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1754, 1, '2017-01-30', 16630.00, NULL, 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 1720.00, 1.00, '37', 1, 1720.00, 0.00, 1720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '24/25/26', 3, 2760.00, 0.00, 2760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 86, 580.00, 1.00, '12/11/21/22', 4, 2320.00, 0.00, 2320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1100.00, 1.00, NULL, 1, 1100.00, 50.00, 550.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '33/32/31/41/42/43', 6, 3480.00, 0.00, 3480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 2900.00, 1.00, '12/22', 2, 5800.00, 0.00, 5800.00, false);

    -- Paciente 177 | Fecha: 2019-09-18 | Total: 144450.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (177, 1, '2019-09-18', 144450.00, '{"A":"ELEMENTOS DENTAL 35-44-45 SI PRESENTA SENSIBILIDAD SE RECOMIENDA HACER TRATAMIENTO DE CONDUCTO BS. 2430.-\r\nSE RECOMIENDA HACER IMPLANTES EN PIEZAS27/36/47 BS C/U7.000,MUÑON S/ IMPLANTES BS C/U1750,CORONAS METAL PORCELANA S/ IMPLANTES BS C/U4150.","B":"ELEMENTOS DENTAL 35-44-45 SI PRESENTA SENSIBILIDAD SE RECOMIENDA HACER TRATAMIENTO DE CONDUCTO BS. 2430.-\r\nSE RECOMIENDA HACER IMPLANTES EN PIEZAS 27/36/47 C/U BS 7.000, MUÑON S/ IMPLANTE C/U BS 1750, CORONAS METAL PORCELANA S/ IMPLANTES BS C/U4150."}', 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 3190.00, 1.00, '13-12-11-21-22-23', 6, 19140.00, 10.00, 17226.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '16-15-14-24-25-26', 6, 34140.00, 10.00, 30726.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '27', 1, 1010.00, 10.00, 909.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '37-46', 2, 11380.00, 10.00, 10242.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '34-35-44-45', 4, 12720.00, 10.00, 11448.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 203, 1900.00, 1.00, NULL, 1, 1900.00, 10.00, 1710.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 135, 2100.00, 1.00, '13-12-11-21-22-23', 6, 12600.00, 10.00, 11340.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5690.00, 1.00, '14-15-16-24-25-26', 6, 34140.00, 10.00, 30726.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '27', 1, 1010.00, 10.00, 909.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '34-35-44-45', 4, 12720.00, 10.00, 11448.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5690.00, 1.00, '37-46', 2, 11380.00, 10.00, 10242.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 203, 1900.00, 1.00, NULL, 1, 1900.00, 10.00, 1710.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '26-34', 2, 3060.00, 10.00, 2754.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1530.00, 1.00, '26-34', 2, 3060.00, 0.00, 3060.00, false);

    -- Paciente 325 | Fecha: 2019-09-18 | Total: 17856.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (325, 1, '2019-09-18', 17856.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '11-12-13', 3, 3030.00, 20.00, 2424.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '21-22-23', 3, 3030.00, 20.00, 2424.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '24-14', 2, 1280.00, 20.00, 1024.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '26', 1, 3180.00, 20.00, 2544.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '27', 1, 1010.00, 20.00, 808.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '16-17', 2, 2020.00, 20.00, 1616.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '33-43', 2, 1280.00, 20.00, 1024.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '45-35', 2, 1280.00, 20.00, 1024.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '46', 1, 3180.00, 20.00, 2544.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '47-36-37', 3, 3030.00, 20.00, 2424.00, false);

    -- Paciente 81 | Fecha: 2019-09-19 | Total: 26528.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (81, 1, '2019-09-19', 26528.00, '{"A":"FASE A:  QUIRURGICA\r\nFASE B REHABILITACION: TRANSCURRIDOS 3 A 4 MESES DE \r\nPACIENTE REQUIERE IMPLANTES EN ELEMENTOS DENTALES 45 Y 47"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '37-38', 2, 2020.00, 20.00, 1616.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '36/37', 2, 14000.00, 20.00, 11200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2800.00, 1.00, '35', 1, 2800.00, 20.00, 2240.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '36/37', 2, 3500.00, 20.00, 2800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4150.00, 1.00, '36/37', 2, 8300.00, 20.00, 6640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 227, 2540.00, 1.00, NULL, 1, 2540.00, 20.00, 2032.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 81 | Fecha: 2022-12-28 | Total: 31380.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (81, 1, '2022-12-28', 31380.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 301, 3000.00, 1.00, '45/46', 2, 6000.00, 0.00, 6000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 5000.00, 1.00, '45/46', 2, 10000.00, 0.00, 10000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 222, 2000.00, 1.00, '45/46', 2, 4000.00, 0.00, 4000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 311, 5690.00, 1.00, '45/46', 2, 11380.00, 0.00, 11380.00, false);

    -- Paciente 81 | Fecha: 2022-12-29 | Total: 9179.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (81, 1, '2022-12-29', 9179.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '38-35-43-48', 4, 4040.00, 50.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 60, 1520.00, 1.00, '38-35-34-48', 4, 6080.00, 20.00, 4864.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 239, 2550.00, 1.00, NULL, 1, 2550.00, 10.00, 2295.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 1764 | Fecha: 2018-03-12 | Total: 62440.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1764, 1, '2018-03-12', 62440.00, NULL, 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 3310.00, 1.00, '17', 1, 3310.00, 0.00, 3310.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '17/16/15/25', 4, 6120.00, 0.00, 6120.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '17/16/14/26/27', 5, 15900.00, 0.00, 15900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2690.00, 1.00, '16', 1, 2690.00, 0.00, 2690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '15/25', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '15/25', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 3190.00, 1.00, '13/12/11/21/22/23', 6, 19140.00, 0.00, 19140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '17/16/14/24', 4, 12720.00, 0.00, 12720.00, false);

    -- Paciente 1764 | Fecha: 2018-03-13 | Total: 52900.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1764, 1, '2018-03-13', 52900.00, '{"A":"15/25 CORONA PORCELANA PURA\r\nEL PRESENTE PRESUPUESTO ES DE MAXILAR SUPEROR"}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 3310.00, 1.00, '17', 1, 3310.00, 0.00, 3310.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '17/16/15/25', 4, 6120.00, 0.00, 6120.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '17/16/14', 3, 9540.00, 0.00, 9540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2690.00, 1.00, '16', 1, 2690.00, 0.00, 2690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '15/25', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '15/25', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 3190.00, 1.00, '13/12/11/21/22/23', 6, 19140.00, 0.00, 19140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '24/26/27', 3, 9540.00, 0.00, 9540.00, false);

    -- Paciente 1 | Fecha: 2017-05-18 | Total: 12640.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1, 1, '2017-05-18', 12640.00, '{"A":"POSIBLR INCRUSTACION EN PIEZAS DENTALES 14/15 PRECIO C/U 2890BS.\r\nPOSIBLES OBTURACIONES COMPUESTAS PIEZAS DENTALES 44/45, PRECIO 920 BS"}', 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1130.00, 1.00, '16/15', 2, 2260.00, 0.00, 2260.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '24/25/46', 3, 2760.00, 0.00, 2760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '44', 1, 580.00, 0.00, 580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '26', 1, 2890.00, 0.00, 2890.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 122, 100.00, 1.00, '47', 1, 100.00, 0.00, 100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '13/23/33/43', 4, 2320.00, 0.00, 2320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 203, 1730.00, 1.00, NULL, 1, 1730.00, 0.00, 1730.00, false);

    -- Paciente 1 | Fecha: 2019-01-23 | Total: 13250.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1, 1, '2019-01-23', 13250.00, '{"A":"PACIENTE POSIBLEMENTE NECESITE AJUSTE DE OCLUSION POST ORTODONCIA."}', 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 92, 2550.00, 1.00, NULL, 1, 2550.00, 0.00, 2550.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '13/23/33/43', 4, 2560.00, 0.00, 2560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 111, 1980.00, 1.00, NULL, 2, 3960.00, 0.00, 3960.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1010.00, 1.00, '12/22', 2, 2020.00, 0.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 640.00, 1.00, '21', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 238, 1520.00, 1.00, NULL, 1, 1520.00, 0.00, 1520.00, false);

    -- Paciente 372 | Fecha: 2016-06-06 | Total: 132310.50
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (372, 1, '2016-06-06', 132310.50, '{"A":"POSIBLE ENDODONCIA EN PIEZA 16 BS 2440, POSIBLE MUÑON MAS POPSTE 1390 Y POSIBLE CORONA PP  BS 5170"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5170.00, 1.00, '13/12/11/21/22', 5, 25850.00, 15.00, 21972.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 2210.00, 1.00, '12/22', 2, 4420.00, 0.00, 4420.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '12/22', 2, 2780.00, 0.00, 2780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 86, 580.00, 1.00, '23/16', 2, 1160.00, 0.00, 1160.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '23/16', 2, 1840.00, 0.00, 1840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5170.00, 1.00, '13/12/22/23', 4, 20680.00, 15.00, 17578.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 8110.00, 1.00, '11/21/24/25', 4, 32440.00, 0.00, 32440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 2900.00, 1.00, '11/21/24/25', 4, 11600.00, 0.00, 11600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 311, 4900.00, 1.00, '11/21/24/25', 4, 19600.00, 0.00, 19600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 210, 580.00, 1.00, '23', 1, 580.00, 0.00, 580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 162, 2210.00, 1.00, '12/22/23', 3, 6630.00, 0.00, 6630.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1390.00, 1.00, '12/22/23', 3, 4170.00, 0.00, 4170.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 580.00, 1.00, '13/12/11/21/22', 5, 2900.00, 0.00, 2900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 580.00, 1.00, '13/12/11/21/22/23', 6, 3480.00, 0.00, 3480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 580.00, 1.00, '24/25', 2, 1160.00, 0.00, 1160.00, false);

    -- Paciente 372 | Fecha: 2019-01-30 | Total: 15000.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (372, 1, '2019-01-30', 15000.00, NULL, 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 195, 2500.00, 1.00, '13/12/11/21/22/23', 6, 15000.00, 0.00, 15000.00, false);

    -- Paciente 372 | Fecha: 2025-08-14 | Total: 72240.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (372, 1, '2025-08-14', 72240.00, '{"A":"-SE SUGIERE EXTRACCION DE ELEMENTO DENTAL 36\r\n-LIMPIEZAS DENTALES CADA 4 MESES PARA CONSERVAR SALUD ORAL","B":"-LIMPIEZAS DENTALES CADA 4 MESES PARA CONSERVAR SALUD ORAL"}', 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1920.00, 1.00, '41/42', 2, 3840.00, 0.00, 3840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 5040.00, 1.00, '31/32', 2, 10080.00, 0.00, 10080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 3600.00, 1.00, '31/32', 2, 7200.00, 0.00, 7200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 1080.00, 1.00, '31/32', 2, 2160.00, 0.00, 2160.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1920.00, 1.00, '41/42/31/32/36', 5, 9600.00, 0.00, 9600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 236, 3360.00, 1.00, NULL, 1, 3360.00, 0.00, 3360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 249, 1200.00, 1.00, '44/46/47', 3, 3600.00, 0.00, 3600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 3600.00, 1.00, '44/46/47', 3, 10800.00, 0.00, 10800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 195, 5400.00, 1.00, '44/45/46/47', 4, 21600.00, 0.00, 21600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2275 | Fecha: 2019-02-01 | Total: 3180.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2275, 1, '2019-02-01', 3180.00, NULL, 7)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '15', 1, 3180.00, 0.00, 3180.00, false);

    -- Paciente 2296 | Fecha: 2019-02-15 | Total: 31429.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2296, 1, '2019-02-15', 31429.00, '{"A":"PROTESIS TOTAL PROVISIONAL BS. 2530.-","B":"PROTESIS TOTAL PROVISIONAL BS.2530.-"}', 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '17/16/15/14/13/11', 6, 6060.00, 10.00, 5454.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '21/22/23/24/25/27', 6, 6060.00, 10.00, 5454.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '14/13/11/21/22/23', 6, 6060.00, 10.00, 5454.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 202, 10200.00, 1.00, NULL, 1, 10200.00, 10.00, 9180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 640.00, 1.00, '17/16/15/24', 4, 2560.00, 30.00, 1792.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '25/27', 2, 2020.00, 10.00, 1818.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 385, 2530.00, 1.00, NULL, 1, 2530.00, 10.00, 2277.00, false);

    -- Paciente 1625 | Fecha: 2019-03-01 | Total: 75620.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1625, 1, '2019-03-01', 75620.00, NULL, 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 111, 1980.00, 1.00, NULL, 1, 1980.00, 0.00, 1980.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 5690.00, 1.00, '13/12/11/21/22/23', 6, 34140.00, 0.00, 34140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '14/15/24', 3, 9540.00, 0.00, 9540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 86, 640.00, 1.00, '12/13', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '33/43', 2, 2020.00, 0.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 203, 1900.00, 1.00, NULL, 1, 1900.00, 0.00, 1900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 111, 1980.00, 1.00, NULL, 2, 3960.00, 0.00, 3960.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1010.00, 1.00, '13/12/11/21/22/23', 6, 6060.00, 0.00, 6060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '14/15/24', 3, 9540.00, 0.00, 9540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 86, 640.00, 1.00, '12/13', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1010.00, 1.00, '33/43', 2, 2020.00, 0.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 203, 1900.00, 1.00, NULL, 1, 1900.00, 0.00, 1900.00, false);

    -- Paciente 1625 | Fecha: 2025-04-07 | Total: 42640.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1625, 1, '2025-04-07', 42640.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4400.00, 1.00, '12/11/21/22', 4, 17600.00, 0.00, 17600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 138, 2750.00, 1.00, NULL, 2, 5500.00, 0.00, 5500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3510.00, 1.00, '11/12/21/22', 4, 14040.00, 0.00, 14040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 138, 2750.00, 1.00, NULL, 2, 5500.00, 0.00, 5500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 471 | Fecha: 2019-10-03 | Total: 8920.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (471, 1, '2019-10-03', 8920.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '45', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2800.00, 1.00, '45', 1, 2800.00, 0.00, 2800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '45', 1, 1530.00, 0.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3950.00, 1.00, '45', 1, 3950.00, 0.00, 3950.00, false);

    -- Paciente 2213 | Fecha: 2019-10-08 | Total: 2098.50
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2213, 1, '2019-10-08', 2098.50, '{"A":"CADA TRATAMIENTO NECESITA MANTENIMIENTO CADA 6 MESES"}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1240.00, 1.00, '22', 1, 1240.00, 15.00, 1240.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '12', 1, 1010.00, 15.00, 858.50, false);

    -- Paciente 1144 | Fecha: 2019-10-16 | Total: 12370.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1144, 1, '2019-10-16', 12370.00, '{"A":"PIEZAS 12 Y 23  POSIBLE OP. SIMPLE"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 760.00, 1.00, NULL, 1, 760.00, 0.00, 760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 9, 80.00, 1.00, '37', 1, 80.00, 0.00, 80.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '37', 1, 3180.00, 0.00, 3180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '38/347/46/45', 5, 5050.00, 0.00, 5050.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '26/11', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '24/15', 2, 2020.00, 0.00, 2020.00, false);

    -- Paciente 2165 | Fecha: 2018-10-02 | Total: 35442.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2165, 1, '2018-10-02', 35442.00, '{"A":"TERCEROS MOLARES SE EVALUARAN SI NECETITAN EXODONCIA","B":"SE REALIZARA INCRUSTACION EN ALGUNOS DIENTES."}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '16/17/26/36/37/46', 6, 19080.00, 0.00, 19080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '13/23/12/11/21/22', 6, 3840.00, 0.00, 3840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '34/35/44', 3, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '47', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1210.00, 1.00, NULL, 1, 1210.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1010.00, 1.00, '44/45/34/35/43/33', 6, 6060.00, 20.00, 4848.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1010.00, 1.00, '46/47/36/37', 4, 4040.00, 20.00, 3232.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '16', 1, 1530.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 1890.00, 1.00, '16', 1, 1890.00, 20.00, 1512.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2165 | Fecha: 2024-05-15 | Total: 99160.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2165, 1, '2024-05-15', 99160.00, '{"A":"PLAN DE TRATAMIENTO FUNCIONAL\r\nPOR SENSIBILIDAD EXISTE POSIBILIDAD DE REALIZAR ENDODODNCIA.","B":"PLAN ESTETICO ANTERIOR SUPERIOR"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 145, 770.00, 1.00, NULL, 1, 770.00, 0.00, 770.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '37-36-47-46', 4, 12720.00, 0.00, 12720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '34-35-44-45', 4, 12720.00, 0.00, 12720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '38-48-18', 3, 3150.00, 0.00, 3150.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '33-32-31-41-42-43', 6, 3900.00, 0.00, 3900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '15-14-24-26-28', 5, 15900.00, 0.00, 15900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 135, 2100.00, 1.00, '13-12-11-21-22-23', 6, 12600.00, 0.00, 12600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1400.00, 1.00, NULL, 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 177, 4000.00, 1.00, '13-12-11-21-22-23', 6, 24000.00, 0.00, 24000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 177, 4000.00, 1.00, '14-15-24', 3, 12000.00, 0.00, 12000.00, false);

    -- Paciente 1669 | Fecha: 2015-11-17 | Total: 11482.50
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1669, 1, '2015-11-17', 11482.50, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 2210.00, 1.00, '13', 1, 2210.00, 25.00, 1657.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 81, 1160.00, 1.00, '13', 1, 1160.00, 25.00, 870.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 920.00, 1.00, '16', 1, 920.00, 25.00, 690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 2210.00, 1.00, '15', 1, 2210.00, 25.00, 1657.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '15', 1, 1390.00, 25.00, 1042.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 580.00, 1.00, '13/14/15', 3, 1740.00, 25.00, 1305.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 159, 2550.00, 1.00, '23', 1, 2550.00, 25.00, 1912.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1390.00, 1.00, '25', 1, 1390.00, 25.00, 1042.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 580.00, 1.00, '23/24/25', 3, 1740.00, 25.00, 1305.00, false);

    -- Paciente 771 | Fecha: 2015-11-04 | Total: 3200.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (771, 1, '2015-11-04', 3200.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 111, 1600.00, 1.00, NULL, 2, 3200.00, 0.00, 3200.00, false);

    -- Paciente 259 | Fecha: 2015-11-06 | Total: 2624.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (259, 1, '2015-11-06', 2624.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 111, 1600.00, 1.00, NULL, 2, 3200.00, 18.00, 2624.00, false);

    -- Paciente 259 | Fecha: 2022-08-25 | Total: 650.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (259, 1, '2022-08-25', 650.00, '{"A":"SE REALIZARA OBTURACION DE RESINA PARA VALORAR EVOLUCION CON MOLAR EN OCLUSION, SE RECOMIENDA A LOS DOS MESES REALIZAR INCRUSTACION DE CEROMERO (3180 BS)SI NO EXISTE SINTOMATOLOGIA"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '46', 1, 650.00, 0.00, 650.00, false);

    -- Paciente 1480 | Fecha: 2015-05-28 | Total: 43776.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1480, 1, '2015-05-28', 43776.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '17/47', 2, 5780.00, 30.00, 4046.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 82, 3480.00, 1.00, '16', 1, 3480.00, 20.00, 2784.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 8110.00, 1.00, '16', 1, 8110.00, 30.00, 5677.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2900.00, 1.00, '16', 1, 2900.00, 30.00, 2030.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4630.00, 1.00, '16', 1, 4630.00, 30.00, 3241.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '14', 1, 1390.00, 30.00, 973.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '14', 1, 4400.00, 30.00, 3080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '27-24-23', 3, 2760.00, 30.00, 1932.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '37-36-35', 3, 13200.00, 30.00, 9240.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '48-44-43', 3, 2760.00, 30.00, 1932.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2440.00, 1.00, '46', 1, 2440.00, 30.00, 1708.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '46', 1, 1390.00, 30.00, 973.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '46-45', 2, 8800.00, 30.00, 6160.00, false);

    -- Paciente 1480 | Fecha: 2015-11-09 | Total: 16280.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1480, 1, '2015-11-09', 16280.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 305, 7000.00, 1.00, '16', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 309, 1750.00, 1.00, '16', 1, 1750.00, 0.00, 1750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2900.00, 1.00, '16', 1, 2900.00, 0.00, 2900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4630.00, 1.00, '16', 1, 4630.00, 0.00, 4630.00, false);

    -- Paciente 1679 | Fecha: 2015-11-11 | Total: 20170.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1679, 1, '2015-11-11', 20170.00, NULL, 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '43/44', 2, 1160.00, 0.00, 1160.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '15/13/12/11', 4, 3680.00, 0.00, 3680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '21/22/24/25', 4, 3680.00, 0.00, 3680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 114, 1730.00, 1.00, '13/12/11/21/22/23', 6, 10380.00, 0.00, 10380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 35, 1270.00, 1.00, '28', 1, 1270.00, 0.00, 1270.00, false);

    -- Paciente 1003 | Fecha: 2017-06-23 | Total: 109170.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1003, 1, '2017-06-23', 109170.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 8000.00, 1.00, '24-36-46', 3, 24000.00, 0.00, 24000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '14-16', 2, 6360.00, 0.00, 6360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '26', 1, 1530.00, 0.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 1890.00, 1.00, '26', 1, 1890.00, 0.00, 1890.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '13-12-11-21-22-23', 6, 34140.00, 0.00, 34140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 3190.00, 1.00, '24-36-46', 3, 9570.00, 0.00, 9570.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4150.00, 1.00, '25-36-46', 3, 12450.00, 0.00, 12450.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '37-34-44-45', 4, 12720.00, 0.00, 12720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '33-32-31-42-43', 5, 3200.00, 0.00, 3200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 3310.00, 1.00, '26', 1, 3310.00, 0.00, 3310.00, false);

    -- Paciente 1997 | Fecha: 2017-06-23 | Total: 12240.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1997, 1, '2017-06-23', 12240.00, '{"A":"EN UNIDAD DENTAL 46 Y 47 SE RECOMIENDA DEJAR CORONAS PROVISORIAS POR 3 MESES Y LUEGO DE LA EVALUACION CAMBIARLAS POR CORONAS DEFINITIVAS."}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 640.00, 1.00, '46-47', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 3310.00, 1.00, '46-47', 2, 6620.00, 0.00, 6620.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '46-47', 2, 3060.00, 0.00, 3060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '46-47', 2, 1280.00, 0.00, 1280.00, false);

    -- Paciente 1988 | Fecha: 2017-06-27 | Total: 14336.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1988, 1, '2017-06-27', 14336.00, '{"A":"MAXILAR SUPERIOR\r\nCONSULTAR CON DR. ARTIEDA ALTERNATIVAS DE PAGO","B":"MAXILAR INFERIOR\r\nPLANIFICACION DE IMPLANTES\r\nCONSULTAR CON DR. ARTIEDA ALTERNATIVAS DE PAGO"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '17', 1, 1010.00, 20.00, 808.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '13', 1, 640.00, 20.00, 512.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '12-22-23-26', 4, 4040.00, 20.00, 3232.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 640.00, 1.00, '11-21', 2, 1280.00, 20.00, 1024.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '11-21', 2, 1280.00, 20.00, 1024.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1010.00, 1.00, '32-42', 2, 2020.00, 20.00, 1616.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3190.00, 1.00, '31', 1, 3190.00, 20.00, 2552.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 210, 640.00, 1.00, '41', 1, 640.00, 20.00, 512.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 640.00, 1.00, '41', 1, 640.00, 20.00, 512.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '37', 1, 3180.00, 20.00, 2544.00, false);

    -- Paciente 146 | Fecha: 2017-08-31 | Total: 49280.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (146, 1, '2017-08-31', 49280.00, '{"A":"ELEMENTO DENTAL 35 SE SUGIERE INCRUSTACION POR EMPAQUETAMIENTO DE ALIMENTO"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '25-26-21-11', 4, 22760.00, 0.00, 22760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 245, 5690.00, 1.00, '12-22', 2, 11380.00, 0.00, 11380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 8000.00, 1.00, '24', 1, 8000.00, 0.00, 8000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '24', 1, 1750.00, 0.00, 1750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 311, 5390.00, 1.00, '24', 1, 5390.00, 0.00, 5390.00, false);

    -- Paciente 2308 | Fecha: 2019-03-07 | Total: 12770.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2308, 1, '2019-03-07', 12770.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2800.00, 1.00, '25', 1, 2800.00, 0.00, 2800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 32, 3640.00, 1.00, '25', 1, 3640.00, 0.00, 3640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '25', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '25', 1, 5690.00, 0.00, 5690.00, false);

    -- Paciente 160 | Fecha: 2019-03-25 | Total: 28920.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (160, 1, '2019-03-25', 28920.00, NULL, 13)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '14-25-36', 3, 17070.00, 0.00, 17070.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3950.00, 1.00, '14-25-36', 3, 11850.00, 0.00, 11850.00, false);

    -- Paciente 469 | Fecha: 2019-06-25 | Total: 7900.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (469, 1, '2019-06-25', 7900.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3950.00, 1.00, '36/37', 2, 7900.00, 0.00, 7900.00, false);

    -- Paciente 2367 | Fecha: 2019-07-17 | Total: 27960.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2367, 1, '2019-07-17', 27960.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 640.00, 1.00, '25', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 160, 3060.00, 1.00, '25', 1, 3060.00, 0.00, 3060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 84, 1590.00, 1.00, '25', 1, 1590.00, 0.00, 1590.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '25', 1, 1530.00, 0.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '25', 1, 5690.00, 0.00, 5690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '25', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '25', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1750.00, 1.00, '25', 1, 1750.00, 0.00, 1750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5690.00, 1.00, '25', 1, 5690.00, 0.00, 5690.00, false);

    -- Paciente 669 | Fecha: 2016-05-12 | Total: 3970.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (669, 1, '2016-05-12', 3970.00, '{"A":"*EVALUAR EXODONCIA DE PIEZAS 18/28/38/48\r\n*PIEZA 27 TAL VEZ SOLO NECESITE SELLADOR DE FOSAS Y FISURAS: 460 BS\r\n*PIEZA 46 TAL VEZ SOLO NECESITE RESELLADO DE RESTAURACIN DE LA ACTUAL: 190 BS\r\n*PIEZA 11 TAL VEZ SEA NECESARIO OBTURACION SIMPLE: 580 BS"}', 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '18/28/38/27/46', 5, 2900.00, 0.00, 2900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 381, 190.00, 1.00, '16/37', 2, 380.00, 0.00, 380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 283, 460.00, 1.00, '48', 1, 460.00, 0.00, 460.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 120, 230.00, 1.00, '11', 1, 230.00, 0.00, 230.00, false);

    -- Paciente 1799 | Fecha: 2016-06-03 | Total: 48630.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1799, 1, '2016-06-03', 48630.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '17/27/37/47', 4, 3680.00, 0.00, 3680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '16/15/14/26/46', 5, 14450.00, 0.00, 14450.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 381, 190.00, 1.00, '45', 1, 190.00, 0.00, 190.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 920.00, 1.00, '17/27/37/47', 4, 3680.00, 0.00, 3680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 2890.00, 1.00, '16/14/46', 3, 8670.00, 0.00, 8670.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 162, 2210.00, 1.00, '15', 1, 2210.00, 0.00, 2210.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 161, 2440.00, 1.00, '26', 1, 2440.00, 0.00, 2440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1390.00, 1.00, '15/26', 2, 2780.00, 0.00, 2780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5170.00, 1.00, '15/26', 2, 10340.00, 0.00, 10340.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 381, 190.00, 1.00, '45', 1, 190.00, 0.00, 190.00, false);

    -- Paciente 1799 | Fecha: 2022-08-15 | Total: 8880.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1799, 1, '2022-08-15', 8880.00, '{"A":"MATERIAL NO CAMBIA DE COLOR NI DE FORMA EN EL TIEMPO"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 5690.00, 1.00, '31', 1, 5690.00, 0.00, 5690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3190.00, 1.00, '41', 1, 3190.00, 0.00, 3190.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 1685 | Fecha: 2017-08-14 | Total: 86700.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1685, 1, '2017-08-14', 86700.00, NULL, 7)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 237, 2670.00, 1.00, NULL, 1, 2670.00, 0.00, 2670.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '17-24-25-27', 4, 12720.00, 0.00, 12720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '37-44-45-47', 4, 12720.00, 0.00, 12720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2800.00, 1.00, '15', 1, 2800.00, 0.00, 2800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '16-15-21-23', 4, 6120.00, 0.00, 6120.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 1890.00, 1.00, '16-34', 2, 3780.00, 0.00, 3780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '14-15-21-22-23-35', 6, 34140.00, 0.00, 34140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 2430.00, 1.00, '21-23', 2, 4860.00, 0.00, 4860.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '13-12', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '33-32-31-41-42-43', 6, 3840.00, 0.00, 3840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 760.00, 1.00, NULL, 1, 760.00, 0.00, 760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '11', 1, 1010.00, 0.00, 1010.00, false);

    -- Paciente 1987 | Fecha: 2017-08-15 | Total: 43120.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1987, 1, '2017-08-15', 43120.00, '{"A":"MATERIAL PUEDE PRESENTAR CAMBIO DE COLOR CON EL TIEMPO Y FRACTURARSE. REQUIERE CONTROL -SEGUIMENTO  SEMESTRAL . EL MANTENIMIENTO ACORDE A HIGIENE Y HABITOS DEL PACIENTE","B":"RESINA DE LABORATORIO, PUEDE PRESENTAR CAMBIO DE COLOR CON EL TIEMPO Y FRACTURARSE. REQUIERE CONTROL Y MANTENIMIENTO ACORDE A HIGIENE Y HABITOS DEL PACIENTE","C":"MATERIAL ESTETICO DE ALTA CALIDAD QUE REQUIERE MINIMO DESGASTE EN LA SUPERFICIE DENTAL. ESTABILIDAD EN COLOR Y TIEMPO .REQUIERE CONTROL Y MANTENIMIENTO ACORDE A HIGIENE Y HABITOS DEL PACIENTE"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 114, 1900.00, 1.00, '12/11/21/22', 4, 7600.00, 0.00, 7600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3190.00, 1.00, '12/11/21/22', 4, 12760.00, 0.00, 12760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 177, 5690.00, 1.00, '12/11/21/22', 4, 22760.00, 0.00, 22760.00, false);

    -- Paciente 77 | Fecha: 2017-08-23 | Total: 14162.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (77, 1, '2017-08-23', 14162.00, '{"A":"ESTE TRATAMIENTO SERA REALIZADO SI ES QUE LA PIEZA 37 NO SE LOGRA RETIRAR PERNO"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '37', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 8000.00, 1.00, '37', 1, 8000.00, 20.00, 6400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '37', 1, 1750.00, 20.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4150.00, 1.00, '37', 1, 4150.00, 20.00, 3320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 383, 2540.00, 1.00, '37', 1, 2540.00, 20.00, 2032.00, false);

    -- Paciente 2737 | Fecha: 2023-02-14 | Total: 99602.50
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2737, 1, '2023-02-14', 99602.50, '{"A":"EXISTE LA POSIBILIDAD DE REALIZAR TRATAMIENTO DE ENDODONCIA EN CASO DE HIPERSENSIBILIDAD IRREVERSIBLE"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4000.00, 1.00, '13-12-11-21-22-23', 6, 24000.00, 25.00, 18000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4000.00, 1.00, '14-24', 2, 8000.00, 25.00, 6000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 138, 2500.00, 1.00, '33-32-31-41-42-43', 1, 2500.00, 25.00, 1875.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1240.00, 1.00, '31', 1, 1240.00, 25.00, 930.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1400.00, 1.00, NULL, 1, 1400.00, 25.00, 1050.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 177, 4000.00, 1.00, '13/12/11/21/22/23', 6, 24000.00, 0.00, 24000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 177, 4000.00, 1.00, '14/24/34/44', 4, 16000.00, 0.00, 16000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 177, 4000.00, 1.00, '33/32/31/41/42/43', 6, 24000.00, 0.00, 24000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 131, 770.00, 1.00, '14-24', 1, 770.00, 25.00, 577.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 293, 1400.00, 1.00, '46', 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 311, 4000.00, 1.00, '46', 1, 4000.00, 0.00, 4000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 303, 1770.00, 1.00, '46', 1, 1770.00, 0.00, 1770.00, false);

    -- Paciente 2459 | Fecha: 2022-07-21 | Total: 48141.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2459, 1, '2022-07-21', 48141.00, '{"A":"DESCUENTO DEL 20 % SI SE REALIZA EN PAGO EN EL MES\r\nEXISTE LA POSIBILIDAD DE QUE NO SE NECESITE REALIZAR  EL TRATAMIENTO DE CONDUCTOS UNIRRADICULAR, SE VALORARA AL REALIZAR EL TALLADO","B":"DESCUENTO DEL 15 % REALIZANDO UN PLAN DE PAGOS EN 2 MESES\r\nEXISTE LA POSIBILIDAD QUE NO SE NECESITE REALIZAR  EL TRATAMIENTO DE CONDUCTOS UNIRRADICLAR, SE VALORARA AL REALIZAR EL TALLADO"}', 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 131, 770.00, 1.00, '13-12-11-21-22', 1, 770.00, 20.00, 616.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4000.00, 1.00, '13-12-11-21-22', 5, 20000.00, 20.00, 16000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '33-32-31-41-42-43', 6, 3900.00, 20.00, 3120.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 2470.00, 1.00, '22', 1, 2470.00, 20.00, 1976.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 347, 1680.00, 1.00, NULL, 1, 1680.00, 0.00, 1680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 131, 770.00, 1.00, '13-12-11-21-22', 1, 770.00, 15.00, 654.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 177, 4000.00, 1.00, '13-12-11-21-22', 5, 20000.00, 15.00, 17000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 650.00, 1.00, '33-32-31-41-42-43', 6, 3900.00, 15.00, 3315.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 162, 2470.00, 1.00, '22', 1, 2470.00, 15.00, 2099.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 347, 1680.00, 1.00, NULL, 1, 1680.00, 0.00, 1680.00, false);

    -- Paciente 2384 | Fecha: 2023-05-10 | Total: 9520.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2384, 1, '2023-05-10', 9520.00, NULL, 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '32', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 236, 1810.00, 1.00, NULL, 1, 1810.00, 0.00, 1810.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 171, 2670.00, 1.00, '32', 1, 2670.00, 0.00, 2670.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1530.00, 1.00, '32', 1, 1530.00, 0.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 241, 2500.00, 1.00, '32', 1, 2500.00, 0.00, 2500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2745 | Fecha: 2023-01-30 | Total: 7040.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2745, 1, '2023-01-30', 7040.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '23/26', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '23/24/25/26', 4, 2560.00, 0.00, 2560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 249, 640.00, 1.00, '16/18', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 640.00, 1.00, '16/17/18', 3, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2505 | Fecha: 2023-01-31 | Total: 24620.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2505, 1, '2023-01-31', 24620.00, NULL, 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '46', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 3470.00, 1.00, '46', 1, 3470.00, 0.00, 3470.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 32, 3870.00, 1.00, '46', 1, 3870.00, 0.00, 3870.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '46', 1, 1530.00, 0.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 2500.00, 1.00, '46', 1, 2500.00, 0.00, 2500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '46', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '46', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1400.00, 1.00, '46', 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 3200.00, 1.00, '46', 1, 3200.00, 0.00, 3200.00, false);

    -- Paciente 2009 | Fecha: 2023-02-03 | Total: 57700.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2009, 1, '2023-02-03', 57700.00, '{"A":"PLAN DE TRATAMIENTO FUNCIONAL POSTERIOR","B":"PLAN DE TRATAMIENTO ANTERIOR ESTETICO"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '17-15-27', 3, 1950.00, 0.00, 1950.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '35-34-45-44-33-43', 6, 3900.00, 0.00, 3900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '16-26-37-36-46-47', 6, 19080.00, 0.00, 19080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 177, 4000.00, 1.00, '13-12-11-21-22-23', 6, 24000.00, 0.00, 24000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 177, 4000.00, 1.00, '14-24', 2, 8000.00, 0.00, 8000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 138, 2500.00, 1.00, NULL, 1, 2500.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 345, 1400.00, 1.00, NULL, 1, 1400.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 650.00, 1.00, '32-31-41', 3, 1950.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 131, 770.00, 1.00, NULL, 1, 770.00, 0.00, 770.00, false);

    -- Paciente 2674 | Fecha: 2023-02-07 | Total: 59060.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2674, 1, '2023-02-07', 59060.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4000.00, 1.00, '13-12-11-21-22-23', 6, 24000.00, 0.00, 24000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4000.00, 1.00, '24-14', 2, 8000.00, 0.00, 8000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 131, 770.00, 1.00, NULL, 1, 770.00, 0.00, 770.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3190.00, 1.00, '13-12-11-21-22-23', 6, 19140.00, 0.00, 19140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3190.00, 1.00, '14-24', 2, 6380.00, 0.00, 6380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 131, 770.00, 1.00, NULL, 1, 770.00, 0.00, 770.00, false);

    -- Paciente 1745 | Fecha: 2023-02-14 | Total: 65730.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1745, 1, '2023-02-14', 65730.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4000.00, 1.00, '13-12-11-21-22-23', 6, 24000.00, 0.00, 24000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3190.00, 1.00, '13-12-11-21-22-23', 6, 19140.00, 0.00, 19140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 116, 650.00, 1.00, '47-46-45-35-34', 5, 3250.00, 0.00, 3250.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4000.00, 1.00, '14-24', 2, 8000.00, 0.00, 8000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3190.00, 1.00, '14-24', 2, 6380.00, 0.00, 6380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 121, 1240.00, 1.00, '12-11-21-22', 4, 4960.00, 0.00, 4960.00, false);

    -- Paciente 1745 | Fecha: 2024-03-05 | Total: 6360.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1745, 1, '2024-03-05', 6360.00, '{"A":"POSTERIOR A 4 MESES SE REALIZARA MUÑOM+ IMPLANTE+ CORONA"}', 20)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '17', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 60, 1520.00, 1.00, '17', 1, 1520.00, 0.00, 1520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 82, 3830.00, 1.00, '17', 1, 3830.00, 0.00, 3830.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 688 | Fecha: 2023-02-02 | Total: 4879.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (688, 1, '2023-02-02', 4879.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '26-25-24-23', 4, 2600.00, 15.00, 2210.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '47', 1, 640.00, 15.00, 544.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 2500.00, 1.00, '47', 1, 2500.00, 15.00, 2125.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '47', 1, 640.00, 100.00, 0.00, false);

    -- Paciente 2851 | Fecha: 2024-03-15 | Total: 133002.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2851, 1, '2024-03-15', 133002.00, '{"A":"IMPLANTES INDIVIDUALES\r\nINICIAR POR SECTOR ANTERO SUPERIOR, MAXILAR SUPERIOR\r\nPOSTERIORMENTE MAXILAR INFERIOR\r\nSE MANTIENEN PRECIOS PREVIOS, ACTUALMENTE EXISTE UNA MODIFICACION EN EL ARANCEL.","B":"EL PRESENTE PRESUPUESTO ES SOLO MAXILAR SUPERIOR, REQUIERE 4 IMPLANTES EN MAXILAR INFERIOR.\r\nSE MANTIENEN PRECIOS PREVIOS, ACTUALMENTE EXISTE UNA MODIFICACION EN EL ARANCEL."}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '13/12/11/21/22', 5, 35000.00, 20.00, 28000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1400.00, 1.00, '13/12/11/21/22', 5, 7000.00, 20.00, 5600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 311, 4000.00, 1.00, '13/12/11/21/22', 4, 16000.00, 20.00, 12800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '13', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 93, 5460.00, 1.00, '13/11/21', 1, 5460.00, 20.00, 4368.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '15/16', 2, 14000.00, 20.00, 11200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1400.00, 1.00, '15/16', 2, 2800.00, 20.00, 2240.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 311, 4000.00, 1.00, '15/16', 2, 8000.00, 20.00, 6400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 326, 850.00, 1.00, NULL, 1, 850.00, 20.00, 680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '13/14', 2, 2020.00, 20.00, 1616.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 93, 5460.00, 1.00, '13/11/21', 1, 5460.00, 20.00, 4368.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '22/11/13/15/16', 5, 35000.00, 20.00, 28000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 323, 21000.00, 1.00, NULL, 1, 21000.00, 20.00, 16800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 327, 2310.00, 1.00, '22/11/13/15/16', 5, 11550.00, 20.00, 9240.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 326, 850.00, 1.00, NULL, 1, 850.00, 20.00, 680.00, false);

    -- Paciente 2851 | Fecha: 2024-03-15 | Total: 120680.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2851, 1, '2024-03-15', 120680.00, '{"A":"SE RECOMIENDA INICIAR POR ESTA FASE DE IMPLANTE\r\nPLAN DE TRATAMIENTO SECTOR 1 POSTERIOR, SUPERIOR DERECHA\r\nFASE QUIRURGICA (ESCANEO+GUIA+IMPLANTE)\r\nPOSTERIOR A LOS 3-5 MESES\r\nFASE DE REHABILITACION (MUÑON Y CORONA)","B":"PLAN DE TRATAMIENTO SECTOR ANTERIOR SUPERIOR\r\nFASE QUIRURGICA (ESCANEO+GUIA+IMPLANTE+ CORONAS PROVISIONALES)\r\nPOSTERIOR A LOS 3-5 MESES\r\nFASE DE REHABILITACION (MUÑON Y CORONA)","C":"PLAN DE TRATAMIENTO SECTOR 3-4 INFERIORO POSTERIOR DERECHO E IZQUIERDO\r\nFASE QUIRURGICA (ESCANEO+GUIA+IMPLANTE)\r\nPOSTERIOR A LOS 3-5 MESES\r\nFASE DE REJHABILITACION (MUÑON Y CORONA)"}', 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 24, 400.00, 1.00, '15-14-12-11-21-22', 1, 400.00, 0.00, 400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 310, 650.00, 1.00, '15/16', 2, 1300.00, 20.00, 1040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '15/16', 2, 14000.00, 20.00, 11200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1400.00, 1.00, '15/16', 2, 2800.00, 20.00, 2240.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 311, 4000.00, 1.00, '15/16', 2, 8000.00, 20.00, 6400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 326, 850.00, 1.00, '13-12-11-21-22', 1, 850.00, 20.00, 680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '13-12-11-21-22', 5, 35000.00, 20.00, 28000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1400.00, 1.00, '13-12-11-21-22', 5, 7000.00, 20.00, 5600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 311, 4000.00, 1.00, '13-12-11-21-22', 5, 20000.00, 20.00, 16000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 24, 400.00, 1.00, '36-37-45-46', 1, 400.00, 0.00, 400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 326, 850.00, 1.00, '36-37-45-46', 1, 850.00, 20.00, 680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 292, 7000.00, 1.00, '37-36-45-46', 4, 28000.00, 20.00, 22400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 293, 1400.00, 1.00, '36-37-45-46', 4, 5600.00, 20.00, 4480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 311, 4000.00, 1.00, '36-37-45-46', 4, 16000.00, 20.00, 12800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 640.00, 1.00, '13-12-11-21-22-23', 6, 3840.00, 50.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 640.00, 1.00, '14', 1, 640.00, 20.00, 512.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 241, 3000.00, 1.00, '14-23', 2, 6000.00, 20.00, 4800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '13', 1, 1010.00, 20.00, 808.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 24, 400.00, 1.00, NULL, 1, 400.00, 20.00, 320.00, false);

    -- Paciente 800 | Fecha: 2024-09-30 | Total: 35400.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (800, 1, '2024-09-30', 35400.00, '{"A":"SE RECOMIENDA HACER GUIA ANTERIOR INFERIOR PARA PROTEGER EL DESGASTE CON OBTURACIONES DIRECTAS \r\n33-32-31-41-42-43 ( DE CANINO A CANINO) 650 BS C/U\r\nSE PUEDE REALIZAR ESTE TRATAMIENTO EN UNA SEGUNDA FASE"}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 145, 1440.00, 1.00, NULL, 1, 1440.00, 0.00, 1440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 4720.00, 1.00, '38-48-47', 3, 14160.00, 0.00, 14160.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 5640.00, 1.00, '36-37', 2, 11280.00, 0.00, 11280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1550.00, 1.00, '46-45-44-34-35', 5, 7750.00, 0.00, 7750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 275, 770.00, 1.00, NULL, 1, 770.00, 0.00, 770.00, false);

    -- Paciente 813 | Fecha: 2016-03-24 | Total: 36800.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (813, 1, '2016-03-24', 36800.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 112, 2000.00, 1.00, NULL, 2, 4000.00, 0.00, 4000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '13/23/14/15/44/45', 6, 5520.00, 0.00, 5520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '12/11/21/22', 4, 2320.00, 0.00, 2320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '24/25/26/27', 4, 11560.00, 0.00, 11560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '34/35', 2, 1840.00, 0.00, 1840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '36/37/46/47', 4, 11560.00, 0.00, 11560.00, false);

    -- Paciente 813 | Fecha: 2024-09-02 | Total: 27670.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (813, 1, '2024-09-02', 27670.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '13/23/14', 3, 3150.00, 0.00, 3150.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '24/25/26/27', 4, 12720.00, 0.00, 12720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '13/12/11/21/22/23', 6, 3900.00, 0.00, 3900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '33/32/31/41/42/43', 6, 3900.00, 0.00, 3900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 218, 4000.00, 1.00, '15', 1, 4000.00, 0.00, 4000.00, false);

    -- Paciente 813 | Fecha: 2024-10-02 | Total: 24633.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (813, 1, '2024-10-02', 24633.00, '{"A":"REHABILITACION ADHESIVA, MAXILAR INFERIOR PARA DEVOLVER DIMENSION VERTICAL, ALTURA POSTERIOR ENTRE MAXILARES","B":"SE RECOMIENDA REALIZAR OBTURACIONES EN SECTOR SUPEIOR POR PALATINO POR DESGASTE DE ESMALTE Y EXPOSICION DE DENTINA"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '37-36', 2, 6360.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '34-44-45-46', 4, 12720.00, 15.00, 10812.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '33-32-31-41-42-43', 6, 3900.00, 15.00, 3315.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 650.00, 1.00, '13-12-11-21-22-23', 6, 3900.00, 15.00, 3315.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '26-27', 2, 6360.00, 15.00, 5406.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '47-35', 2, 2100.00, 15.00, 1785.00, false);

    -- Paciente 2875 | Fecha: 2024-10-02 | Total: 13281.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2875, 1, '2024-10-02', 13281.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 3190.00, 1.00, '13-12-11-21-22-23', 6, 19140.00, 35.00, 12441.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '14-24', 2, 2100.00, 60.00, 840.00, false);

    -- Paciente 1672 | Fecha: 2024-12-05 | Total: 26300.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1672, 1, '2024-12-05', 26300.00, '{"A":"SE VALORARANECESIDAD DE OBTURACIONES DE RESINA EN ELEMENTOS DENTARIOS ANTERIORES SUPERIORES POST TRATAMIENTO DE ORTODONCIA"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 275, 920.00, 1.00, NULL, 1, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '37/36/35/47/46/45', 6, 19080.00, 0.00, 19080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '33/32/31/41/42/43', 6, 6300.00, 0.00, 6300.00, false);

    -- Paciente 427 | Fecha: 2023-09-29 | Total: 2000.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (427, 1, '2023-09-29', 2000.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 221, 2500.00, 1.00, NULL, 1, 2500.00, 20.00, 2000.00, false);

    -- Paciente 427 | Fecha: 2024-01-08 | Total: 3040.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (427, 1, '2024-01-08', 3040.00, NULL, 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 123, 2280.00, 1.00, NULL, 1, 2280.00, 0.00, 2280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 760.00, 1.00, NULL, 1, 760.00, 0.00, 760.00, false);

    -- Paciente 427 | Fecha: 2025-10-07 | Total: 66550.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (427, 1, '2025-10-07', 66550.00, '{"A":"EN SIGUIENTES PROPUESTAS C-D-E  SE INCLUYE REHABILITACION","B":"POSIBLE CIRUGIA APICAL DE ACUERDO A SINTOMATOLOGIA Y EVOLUCION.\r\nLA REHABILITACION FINAL ESTA CONTEMPLADA EN LA PROPUESTA DEL PLAN GENERAL"}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 275, 2700.00, 1.00, NULL, 1, 2700.00, 0.00, 2700.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 160, 6000.00, 1.00, '25', 1, 6000.00, 0.00, 6000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 197, 4720.00, 1.00, '37-36-46', 1, 4720.00, 0.00, 4720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 117, 1550.00, 1.00, '34-35-44-45-48', 5, 7750.00, 0.00, 7750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 116, 960.00, 1.00, '17', 1, 960.00, 0.00, 960.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 117, 1550.00, 1.00, '14-24', 2, 3100.00, 0.00, 3100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 241, 5640.00, 1.00, '25', 1, 5640.00, 0.00, 5640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 197, 4720.00, 1.00, '26', 1, 4720.00, 0.00, 4720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'E', 116, 960.00, 1.00, '33-32-31-41-42-43', 6, 5760.00, 0.00, 5760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'E', 135, 3600.00, 1.00, '21-22-23-11-12-13', 6, 21600.00, 0.00, 21600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'E', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 201, 3600.00, 1.00, '25', 1, 3600.00, 0.00, 3600.00, false);

    -- Paciente 2287 | Fecha: 2025-10-31 | Total: 29340.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2287, 1, '2025-10-31', 29340.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 275, 1440.00, 1.00, NULL, 1, 1440.00, 0.00, 1440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1900.00, 1.00, '37-36-35-34', 4, 7600.00, 0.00, 7600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1900.00, 1.00, '47-46-45-44', 4, 7600.00, 0.00, 7600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 960.00, 1.00, '33-32-31-41-42-43', 6, 5760.00, 0.00, 5760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 960.00, 1.00, '13-12-22-23', 4, 3840.00, 0.00, 3840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1550.00, 1.00, '11-21', 2, 3100.00, 0.00, 3100.00, false);

    -- Paciente 236 | Fecha: 2025-10-31 | Total: 28160.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (236, 1, '2025-10-31', 28160.00, '{"A":"PACIENTE PRESENTA TRAUMA DE OCLUSION, SE RECOMIENDA REHABILITACION PARA EVITAR DESGASTE EN TEJIDOS\r\nSE VALORARA EN 3 MESES SI ES NECESARIO ACOPLAR EN MAXILAR SUPERIOR\r\nSE RECOMIENDA GUARDA OCLUSAL 3 MESES POSTERIOR PARA RELAJACION MUSCULAR BS. 2.640.-"}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 275, 1440.00, 1.00, '8', 1, 1440.00, 0.00, 1440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1900.00, 1.00, '37-36-35-34', 4, 7600.00, 0.00, 7600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1900.00, 1.00, '47-46-45-44', 4, 7600.00, 0.00, 7600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 960.00, 1.00, '33-32-31-41-42-43', 6, 5760.00, 0.00, 5760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 960.00, 1.00, '13-12-11-21-22-23', 6, 5760.00, 0.00, 5760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 659 | Fecha: 2025-11-10 | Total: 400.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (659, 1, '2025-11-10', 400.00, '{"A":"SE RECOMIENDA REALIZARLO UNA VEZ AL MES POR SEIS MESES PARA OBTENER RESULTADOS."}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 153, 400.00, 1.00, NULL, 1, 400.00, 0.00, 400.00, false);

    -- Paciente 2281 | Fecha: 2019-12-17 | Total: 85800.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2281, 1, '2019-12-17', 85800.00, '{"A":"LA PARTE PERIODONTAL ESTA SUJETA A CAMBIO POR VALORACION DRA BIANCHI\r\nDEPENDIEMDO EL RESULTADO DEL TRATAMIENTO PERIODONTAL SE VALORARA LA COLOCACION DEL IMPALNTE"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '13/11/21/22/23', 5, 3200.00, 0.00, 3200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '13/12/11/21/22/23', 6, 3840.00, 0.00, 3840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 93, 4550.00, 1.00, '12', 1, 4550.00, 0.00, 4550.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '24/25/26/34/35/45', 6, 19080.00, 0.00, 19080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '45/46/47', 3, 9540.00, 0.00, 9540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 249, 640.00, 1.00, '36', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 640.00, 1.00, '36', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 640.00, 1.00, '41/42/43/44', 4, 2560.00, 0.00, 2560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 640.00, 1.00, '31/32/33', 3, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 380, 5690.00, 1.00, '11/12/13/21/22/23', 6, 34140.00, 0.00, 34140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 380, 5690.00, 1.00, '36', 1, 5690.00, 0.00, 5690.00, false);

    -- Paciente 2281 | Fecha: 2025-11-12 | Total: 5760.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2281, 1, '2025-11-12', 5760.00, NULL, 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 275, 1440.00, 1.00, NULL, 2, 2880.00, 0.00, 2880.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 275, 1440.00, 1.00, NULL, 2, 2880.00, 0.00, 2880.00, false);

    -- Paciente 3023 | Fecha: 2025-11-12 | Total: 59070.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (3023, 1, '2025-11-12', 59070.00, '{"A":"DE ACUERDO A ENCERADO SE REALIZARA EL PLAN DE REHABILITACION","B":"TRATAMIENTO POSTERIOR Y ANTERIOR FUNCIONAL\r\nSE RECOMIENDA GUARDA OCLUSAL PARA PROTECCION DEL TRATAMIENTO REALIZADO","C":"PLAN DE TRATAMIENTO PENDIENTE DE INCISIVO CENTRAL SUPERIOR DERECHO"}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 275, 1440.00, 1.00, NULL, 2, 2880.00, 0.00, 2880.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 4720.00, 1.00, '16-26-44-35-36-47', 6, 28320.00, 0.00, 28320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1550.00, 1.00, '14-24-25-34', 4, 6200.00, 0.00, 6200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 960.00, 1.00, '17-33-43', 3, 2880.00, 0.00, 2880.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1550.00, 1.00, '13-12-21-22-23', 5, 7750.00, 0.00, 7750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 132, 600.00, 1.00, '32-31-41-42', 4, 2400.00, 0.00, 2400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 241, 5640.00, 1.00, '11', 1, 5640.00, 0.00, 5640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 183, 1080.00, 1.00, '11', 1, 1080.00, 0.00, 1080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 960.00, 1.00, '18-48', 2, 1920.00, 0.00, 1920.00, false);

    -- Paciente 2884 | Fecha: 2024-10-10 | Total: 6340.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2884, 1, '2024-10-10', 6340.00, '{"A":"ELEMENTO DENTAL 25 POSIBLEMENTE REQUIERA MICRO CIRUGIA APICAL.\r\nELEMENTO DENTAL 46 REQUIERE IMPLANTE"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 32, 3870.00, 1.00, '36', 1, 3870.00, 0.00, 3870.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 2470.00, 1.00, '25', 1, 2470.00, 0.00, 2470.00, false);

    -- Paciente 2884 | Fecha: 2025-06-11 | Total: 68016.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2884, 1, '2025-06-11', 68016.00, '{"C":"MAXILAR INFERIOR\r\nPOSIBLE NECESIDAD DE CAMBIO DE OBTURACIONES POR EL CAMBIO DE COLOR."}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 4720.00, 1.00, '17-16-25-35-45', 5, 23600.00, 10.00, 21240.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 135, 3120.00, 1.00, '11-12-13-21-22-23', 6, 18720.00, 10.00, 16848.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1550.00, 1.00, '15-14-24-37', 5, 7750.00, 10.00, 6975.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1550.00, 1.00, '36-34-33-43-44', 5, 7750.00, 10.00, 6975.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 4720.00, 1.00, '26-27', 2, 9440.00, 10.00, 8496.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 2080.00, 1.00, NULL, 1, 2080.00, 10.00, 1872.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 244, 2500.00, 1.00, NULL, 1, 2500.00, 10.00, 2250.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 123, 3360.00, 1.00, NULL, 1, 3360.00, 0.00, 3360.00, false);

    -- Paciente 2981 | Fecha: 2025-09-24 | Total: 99580.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2981, 1, '2025-09-24', 99580.00, '{"A":"SE DEBE REALIZAR ELEVADO DE MORDIDA , POR OCLUSION TRAUMATICA. \r\nREQUIERE REHABILITACION ORAL FUNCIONAL, EN AMBOS MAXILARES.","B":"-PLAN DE TRATAMIENTO CURATIVO-FUNCIONAL\r\n-POSIBLE TRATAMIENTO DE CONDUCTOS EN ELEMENTO DENTAL 16.\r\n-SE EVALUARA SECTOR ANTEROINFERIOR POSTERIOR A FASE 1 DE TRATAMIENTO DENTAL","C":"-DEBE REALIZAR INTERCONSULTA CON OTORRINOLARINGOLOGIA PREVIO A CIRUGIA DE IMPLANTES.\r\n-SE PUEDEN REALIZAR TRES IMPLANTES EN SECTOR SUPERIOR IZQUIERDO 25/26/27"}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 275, 1440.00, 1.00, NULL, 1, 1440.00, 0.00, 1440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 145, 1440.00, 1.00, NULL, 1, 1440.00, 0.00, 1440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 4720.00, 1.00, '16/15/13/23/24/37', 6, 28320.00, 0.00, 28320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1550.00, 1.00, '38/48', 2, 3100.00, 0.00, 3100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 313, 7200.00, 1.00, '25/26/27', 1, 7200.00, 0.00, 7200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 292, 10390.00, 1.00, '25/35/46', 3, 31170.00, 0.00, 31170.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 293, 2970.00, 1.00, '25/35/46', 3, 8910.00, 0.00, 8910.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 294, 6000.00, 1.00, '25/35/46', 3, 18000.00, 0.00, 18000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2981 | Fecha: 2025-11-18 | Total: 144670.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2981, 1, '2025-11-18', 144670.00, '{"A":"PLAN DE TRATAMIENTO FUNCIONAL POSTERIOR\r\nSE DEBE COMPLEMENTAR SECTOR ANTERIOR DE ACUERDO A LA ELECCION DE LA PACIENTE\r\n\r\nPRIMER MOLAR SUPERIOR IZQUIERO 16 POSIBLE TRATAMIENTO DE ENDODONCIA BS. 5040","B":"PLAN ANTERIOR DE ACOPLE\r\nSI PACIENTE REQUIERE ESTETICA SE ENVIAN OTRAS OPCIONES A CONTINUACION\r\nEN ESTA OPCION SE PUEDE REALIZAR BLANQUEMINTO SUPERIOR E INFERIOR (ESTETICA EN COLOR SIN CAMBIAR FORMA)","C":"EN ESTA OPCION SE PUEDE REALIZAR BLANQUEMIENTO INFERIOR PARA NIVELAR COLOR DE CARILLAS SUPERIORES"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 4720.00, 1.00, '16-34-36-44-45-47', 6, 28320.00, 0.00, 28320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1550.00, 1.00, '14-24', 2, 3100.00, 0.00, 3100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1550.00, 1.00, '33-32-31-41-42-43', 6, 9300.00, 0.00, 9300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 121, 1900.00, 1.00, '13-12-11-21-22-23', 6, 11400.00, 0.00, 11400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 115, 6000.00, 1.00, '13-12-11-21-22-23', 6, 36000.00, 0.00, 36000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 117, 1550.00, 1.00, '33-32-31-41-42-43', 6, 9300.00, 0.00, 9300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 177, 7200.00, 1.00, '13-12-11-21-22-23', 6, 43200.00, 10.00, 38880.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 117, 1550.00, 1.00, '33-32-31-41-42-43', 6, 9300.00, 10.00, 8370.00, false);

    -- Paciente 2983 | Fecha: 2025-11-18 | Total: 2640.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2983, 1, '2025-11-18', 2640.00, NULL, 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 2640.00, 1.00, NULL, 1, 2640.00, 0.00, 2640.00, false);

    -- Paciente 3035 | Fecha: 2025-11-21 | Total: 21112.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (3035, 1, '2025-11-21', 21112.00, '{"A":"PROTESIS MAXILAR INFERIOR"}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1550.00, 1.00, '35-45', 2, 3100.00, 20.00, 2480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 6480.00, 1.00, '37', 1, 6480.00, 20.00, 5184.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 3600.00, 1.00, '37', 1, 3600.00, 20.00, 2880.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 5640.00, 1.00, '37', 1, 5640.00, 20.00, 4512.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 850.00, 1.00, NULL, 1, 850.00, 20.00, 680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 267, 4800.00, 1.00, NULL, 1, 4800.00, 20.00, 3840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1920.00, 1.00, '37', 1, 1920.00, 20.00, 1536.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2299 | Fecha: 2022-08-12 | Total: 3000.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2299, 1, '2022-08-12', 3000.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 138, 3000.00, 1.00, NULL, 1, 3000.00, 0.00, 3000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2299 | Fecha: 2023-06-19 | Total: 4230.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2299, 1, '2023-06-19', 4230.00, '{"A":"RESTAURACION QUE SE REALIZA EN LABORATORIO, SE RECOMIENDA POR LA PROFUNDIDAD Y TEJIDO DENTA REMANENTE."}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '45', 1, 3180.00, 0.00, 3180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1050.00, 1.00, '45', 1, 1050.00, 0.00, 1050.00, false);

    -- Paciente 2446 | Fecha: 2022-08-15 | Total: 9540.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2446, 1, '2022-08-15', 9540.00, '{"A":"EXISTE LA POSIBILIDAD DE REALIZAR TRATAMIENTO DE ENDODONCIA POR LA CERCANIA DE LAS CARIES A LOS NERVIOS\r\nEN EL PREMOLAR 44 SE VALORARA CLINICAMENTE SI ES POSIBLE REALIZAR LA RESTAURACION DIRECTA DE ACUERDO AL TEJIDO SANO REMANENTE"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '44-45-46', 3, 9540.00, 0.00, 9540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2583 | Fecha: 2022-08-15 | Total: 9540.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2583, 1, '2022-08-15', 9540.00, '{"A":"EXISTE LA POSIBILIDAD DE REALIZAR TRATAMIENTO DE ENDODONCIA POR LA CERCANIA AL NERVIO"}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '45-46-47', 3, 9540.00, 0.00, 9540.00, false);

    -- Paciente 1787 | Fecha: 2022-08-18 | Total: 3845.40
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1787, 1, '2022-08-18', 3845.40, '{"A":"MATERIAL PROVISIONAL, SE RECOMIENDA POSTERIOR CAMBIO A MATERIAL DEFINITIVO","B":"MATERIAL DEFINITIVO"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '34', 1, 640.00, 13.00, 556.80, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '34', 1, 640.00, 13.00, 556.80, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 241, 2500.00, 1.00, '34', 1, 2500.00, 13.00, 2175.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 249, 640.00, 1.00, '34', 1, 640.00, 13.00, 556.80, false);

    -- Paciente 1952 | Fecha: 2017-03-08 | Total: 13210.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1952, 1, '2017-03-08', 13210.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '16-15-24-34-35-44', 6, 3480.00, 0.00, 3480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '11', 1, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2550.00, 1.00, '45', 1, 2550.00, 0.00, 2550.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '45', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 384, 4870.00, 1.00, '45', 1, 4870.00, 0.00, 4870.00, false);

    -- Paciente 48 | Fecha: 2019-09-17 | Total: 11509.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (48, 1, '2019-09-17', 11509.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 38, 760.00, 1.00, '/14', 1, 760.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '14', 1, 7000.00, 15.00, 5950.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '14', 1, 1750.00, 15.00, 1487.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4150.00, 1.00, '14', 1, 4150.00, 15.00, 3527.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '14', 1, 640.00, 15.00, 544.00, false);

    -- Paciente 2937 | Fecha: 2024-10-15 | Total: 4550.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2937, 1, '2024-10-15', 4550.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '14/15/24/27', 4, 2600.00, 0.00, 2600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '36/37/47', 3, 1950.00, 0.00, 1950.00, false);

    -- Paciente 2904 | Fecha: 2024-11-05 | Total: 47477.50
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2904, 1, '2024-11-05', 47477.50, '{"A":"TRATAMIENTO MAXILAR SUPERIOR","B":"TRATAMIENTO MAXILAR INFERIOR"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 3000.00, 1.00, '26', 1, 3000.00, 15.00, 2550.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '17', 1, 3180.00, 15.00, 2703.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '15-24-25', 3, 3150.00, 15.00, 2677.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '13-12-11-21-22-23', 6, 6300.00, 15.00, 5355.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 244, 1340.00, 1.00, NULL, 1, 1340.00, 15.00, 1139.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '47-45-44-34-35-37', 6, 19080.00, 0.00, 19080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1050.00, 1.00, '46-36', 2, 2100.00, 0.00, 2100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 650.00, 1.00, '33-32-31-41-42-43', 6, 3900.00, 0.00, 3900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 241, 3000.00, 1.00, '26', 1, 3000.00, 15.00, 2550.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 249, 640.00, 1.00, '21', 1, 640.00, 15.00, 544.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 224, 1100.00, 1.00, '21', 1, 1100.00, 15.00, 935.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 183, 640.00, 1.00, '21', 1, 640.00, 15.00, 544.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 218, 4000.00, 1.00, '21', 1, 4000.00, 15.00, 3400.00, false);

    -- Paciente 1852 | Fecha: 2024-01-24 | Total: 67720.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1852, 1, '2024-01-24', 67720.00, '{"A":"TRES A CUATRO MESES POSTERIORES A EXTACCION Y RELLENO OSEO, SE EVALUARA COLOCACION DE IMPLANTE.\r\nSE SUGIERE REALIZAR PROTESIS PROVISORIA POST  COLOCACION IMPLANTE","C":"SE REALIZARA COLOCADO DE IMPLANTES 3 A 4 MESES POSTERIORES A EXTRACCION; REHABILITACION 4 A 6 MESES POSTERIRES A COLOCACION DE LOS MISMOS."}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 37, 1280.00, 1.00, '23', 1, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 82, 3830.00, 1.00, '23', 1, 3830.00, 0.00, 3830.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 62, 650.00, 1.00, '23', 1, 650.00, 0.00, 650.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 236, 1810.00, 1.00, NULL, 1, 1810.00, 0.00, 1810.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 212, 8600.00, 1.00, NULL, 1, 8600.00, 0.00, 8600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '23', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 82, 3830.00, 1.00, '23', 1, 3830.00, 0.00, 3830.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 62, 650.00, 1.00, '23', 1, 650.00, 0.00, 650.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 214, 11400.00, 1.00, NULL, 1, 11400.00, 0.00, 11400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 236, 1810.00, 1.00, NULL, 1, 1810.00, 0.00, 1810.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 212, 8600.00, 1.00, NULL, 1, 8600.00, 0.00, 8600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 24, 400.00, 1.00, NULL, 1, 400.00, 0.00, 400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 310, 650.00, 1.00, '22/23', 1, 650.00, 0.00, 650.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 294, 3200.00, 1.00, '22/23', 2, 6400.00, 0.00, 6400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 293, 1400.00, 1.00, '22/23', 2, 2800.00, 0.00, 2800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 292, 7000.00, 1.00, '22/23', 2, 14000.00, 0.00, 14000.00, false);

    -- Paciente 2358 | Fecha: 2024-01-04 | Total: 9280.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2358, 1, '2024-01-04', 9280.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 123, 2280.00, 1.00, NULL, 1, 2280.00, 0.00, 2280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 111, 2000.00, 1.00, NULL, 2, 4000.00, 0.00, 4000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 138, 3000.00, 1.00, NULL, 1, 3000.00, 0.00, 3000.00, false);

    -- Paciente 86 | Fecha: 2024-06-19 | Total: 53890.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (86, 1, '2024-06-19', 53890.00, '{"A":"PRIMERA OPCION ORDOTONCIA\r\nESTETICA SEGUNDA FASE"}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 145, 770.00, 1.00, NULL, 1, 770.00, 0.00, 770.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '47-44', 2, 6360.00, 0.00, 6360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '14-16-17-37', 4, 12720.00, 0.00, 12720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '33-32-31-41-42-43', 6, 6300.00, 0.00, 6300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '34-35-36-37', 4, 4200.00, 0.00, 4200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '24-26-27', 3, 9540.00, 0.00, 9540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 135, 2100.00, 1.00, '13-12-11-21-22-23', 6, 12600.00, 0.00, 12600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1400.00, 1.00, NULL, 1, 1400.00, 0.00, 1400.00, false);

    -- Paciente 1994 | Fecha: 2021-12-20 | Total: 7500.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1994, 1, '2021-12-20', 7500.00, NULL, 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 3470.00, 1.00, '27', 1, 3470.00, 0.00, 3470.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '27', 1, 1530.00, 0.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 2500.00, 1.00, '27', 1, 2500.00, 0.00, 2500.00, false);

    -- Paciente 1994 | Fecha: 2023-12-21 | Total: 87940.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1994, 1, '2023-12-21', 87940.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4000.00, 1.00, '13-12-11-21-22-23', 6, 24000.00, 0.00, 24000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3190.00, 1.00, '13-12-11-23-22-21', 6, 19140.00, 0.00, 19140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 185, 3200.00, 1.00, '46-36', 2, 6400.00, 0.00, 6400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 185, 3200.00, 1.00, '33-32-31-43-42-41', 6, 19200.00, 0.00, 19200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 185, 3200.00, 1.00, '33-32-31-43-42-41', 6, 19200.00, 0.00, 19200.00, false);

    -- Paciente 2896 | Fecha: 2024-07-19 | Total: 32500.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2896, 1, '2024-07-19', 32500.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '37-35-34-47-44-45', 6, 19080.00, 0.00, 19080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '14-15', 2, 6360.00, 0.00, 6360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 218, 4000.00, 1.00, '25', 1, 4000.00, 0.00, 4000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '25-46', 2, 3060.00, 0.00, 3060.00, false);

    -- Paciente 2064 | Fecha: 2024-07-22 | Total: 63125.40
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2064, 1, '2024-07-22', 63125.40, '{"A":"TRATAMIENTO FUNCIONAL PARA ELEVADO DE DIMENSION VERTICAL POR TRAUMA ANTERIOR PRE EXISTENTE\r\n\r\nTRATAMIENTO DE REHABILITACION  ADITIVO PARA DEVOLVER ALTURA EN AMBOS MAXILARES, PROTEGIENDO TEJIDO DESGASTADO Y DISTRIBUYENDO FUERZAS OCLUSALES","B":"EN 6 MESES CON OCLUSION  ESTABLE Y EN  FUNCION PUEDE VALORARSE MEJORAR LA ESTETICA CON CARILLAS"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '17-16-15-24-27', 5, 15900.00, 17.00, 13197.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 135, 2100.00, 1.00, '13-12-11-21-22-23', 6, 12600.00, 17.00, 10458.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '36-35', 2, 6360.00, 17.00, 5278.80, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '34-44-45', 3, 3150.00, 17.00, 2614.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '32-31-42-42', 4, 2600.00, 17.00, 2158.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1050.00, 1.00, '13-12-11-21-22-23', 6, 6300.00, 0.00, 6300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 145, 770.00, 1.00, NULL, 1, 770.00, 17.00, 639.10, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 115, 3510.00, 1.00, '13-12-11-21-22-23', 6, 21060.00, 0.00, 21060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 116, 710.00, 1.00, '16-15', 2, 1420.00, 0.00, 1420.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2090 | Fecha: 2019-12-24 | Total: 67200.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2090, 1, '2019-12-24', 67200.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 5690.00, 1.00, '13-12-11-21-22-23', 6, 34140.00, 0.00, 34140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 114, 4500.00, 1.00, '13-12-11-21-22-23', 6, 27000.00, 0.00, 27000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '33-32-31-41-42-43', 6, 6060.00, 0.00, 6060.00, false);

    -- Paciente 1520 | Fecha: 2020-01-24 | Total: 18180.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1520, 1, '2020-01-24', 18180.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '16/17/14/13', 4, 4040.00, 0.00, 4040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '24/25/26', 3, 3030.00, 0.00, 3030.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1010.00, 1.00, '44/45/35/34/43/42', 6, 6060.00, 0.00, 6060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1010.00, 1.00, '32/31/41/42/48', 5, 5050.00, 0.00, 5050.00, false);

    -- Paciente 2408 | Fecha: 2020-02-04 | Total: 45577.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2408, 1, '2020-02-04', 45577.00, '{"A":"FASE A QUIRURGICA:  IMPLANTE\r\nFASE B REHABILITACION: TRANSCURRIDOS 4 A 6 MESES DE LA CIRUGIA SE REALIZARA LA REHABILITACION, ES DECIR MUÑONES Y CORONAS SOBRE IMPLANTE."}', 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '46/36', 2, 2020.00, 15.00, 1717.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '36/37/46/45', 4, 28000.00, 15.00, 23800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '36/37/46/45', 4, 7000.00, 15.00, 5950.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4150.00, 1.00, '37/36/46/45', 4, 16600.00, 15.00, 14110.00, false);

    -- Paciente 141 | Fecha: 2019-10-31 | Total: 14000.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (141, 1, '2019-10-31', 14000.00, NULL, 12)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '21/22', 2, 14000.00, 0.00, 14000.00, false);

    -- Paciente 141 | Fecha: 2019-10-31 | Total: 31069.80
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (141, 1, '2019-10-31', 31069.80, '{"A":"SE EVALUARA  COLOCAR MUÑONES Y PROTESIS PROVISIONAL"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '21/22', 2, 14000.00, 18.00, 11480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '21/22/14', 3, 5250.00, 18.00, 4305.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 323, 14000.00, 1.00, '14/13/12/11/21/22', 1, 14000.00, 18.00, 11480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 321, 700.00, 1.00, '21/22/14', 3, 2100.00, 18.00, 1722.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 383, 2540.00, 1.00, '14/13/12/11/21/22', 1, 2540.00, 18.00, 2082.80, false);

    -- Paciente 141 | Fecha: 2020-02-18 | Total: 89040.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (141, 1, '2020-02-18', 89040.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 2430.00, 1.00, '34/35/23/25/15', 5, 12150.00, 0.00, 12150.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 163, 2540.00, 1.00, '24', 1, 2540.00, 0.00, 2540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2690.00, 1.00, '16', 1, 2690.00, 0.00, 2690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '31/41/42/43/26', 5, 3200.00, 0.00, 3200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '44/45/46/47/36', 5, 15900.00, 0.00, 15900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '34/35/23/24/25/15', 6, 9180.00, 0.00, 9180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '16', 1, 1530.00, 0.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '34/35/23/24/25/15', 6, 34140.00, 0.00, 34140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '15', 1, 5690.00, 0.00, 5690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '28/38', 2, 2020.00, 0.00, 2020.00, false);

    -- Paciente 1051 | Fecha: 2017-11-30 | Total: 35810.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1051, 1, '2017-11-30', 35810.00, NULL, 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '46/47/16/17/26/27', 6, 19080.00, 0.00, 19080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '36/37', 2, 6360.00, 0.00, 6360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '44/45/13/15/24', 5, 5050.00, 0.00, 5050.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '25/23/34/35', 4, 4040.00, 0.00, 4040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 86, 640.00, 1.00, '32/42', 2, 1280.00, 0.00, 1280.00, false);

    -- Paciente 1051 | Fecha: 2017-11-30 | Total: 6360.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1051, 1, '2017-11-30', 6360.00, NULL, 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '46/17', 2, 6360.00, 0.00, 6360.00, false);

    -- Paciente 425 | Fecha: 2017-06-01 | Total: 9240.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (425, 1, '2017-06-01', 9240.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '14/13', 2, 1160.00, 0.00, 1160.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '12/11/21/22/23', 5, 4600.00, 0.00, 4600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '33/32/31/41/42/43', 6, 3480.00, 0.00, 3480.00, false);

    -- Paciente 1920 | Fecha: 2017-06-16 | Total: 20810.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1920, 1, '2017-06-16', 20810.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 8110.00, 1.00, '24', 1, 8110.00, 0.00, 8110.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2900.00, 1.00, '24', 1, 2900.00, 0.00, 2900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4630.00, 1.00, '24', 1, 4630.00, 0.00, 4630.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5170.00, 1.00, '25', 1, 5170.00, 0.00, 5170.00, false);

    -- Paciente 1558 | Fecha: 2017-07-18 | Total: 78080.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1558, 1, '2017-07-18', 78080.00, NULL, 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 3190.00, 1.00, '12/11/21/22', 4, 12760.00, 0.00, 12760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '18/17/15/14/24/25', 6, 19080.00, 0.00, 19080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '26/28/38/37/36/35', 6, 19080.00, 0.00, 19080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '34/44/45/46/47/48', 6, 19080.00, 0.00, 19080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '13/23', 2, 2020.00, 0.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '33/43/42/41/31/32', 6, 6060.00, 0.00, 6060.00, false);

    -- Paciente 1839 | Fecha: 2017-08-09 | Total: 3040.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1839, 1, '2017-08-09', 3040.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 221, 3040.00, 1.00, '36', 1, 3040.00, 0.00, 3040.00, false);

    -- Paciente 2026 | Fecha: 2017-08-09 | Total: 4080.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2026, 1, '2017-08-09', 4080.00, NULL, 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 283, 510.00, 1.00, '16/17/26/27/36/37', 6, 3060.00, 0.00, 3060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 283, 510.00, 1.00, '46/47', 2, 1020.00, 0.00, 1020.00, false);

    -- Paciente 1494 | Fecha: 2017-08-09 | Total: 15180.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1494, 1, '2017-08-09', 15180.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 640.00, 1.00, '37/35/34', 3, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2800.00, 1.00, '35', 1, 2800.00, 0.00, 2800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 3310.00, 1.00, '37', 1, 3310.00, 0.00, 3310.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '37/35/34', 3, 4590.00, 0.00, 4590.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '34/35/36/37', 4, 2560.00, 0.00, 2560.00, false);

    -- Paciente 506 | Fecha: 2017-11-07 | Total: 56100.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (506, 1, '2017-11-07', 56100.00, '{"A":"PACIENTE REQUIERE TRATAMIENTO  REHABILITACION ORAL\r\nPOR SOBRE MORDIDA.\r\nPACIENTE REQUIRE TRATAMIENTO INTEGRAL \r\nCIRUGIA DE IMPLANTE. CIRUGIA APICAL\r\nPACIENTE DEBERA INDICAR SI ESTE TRATAMIENTO QUIERE REALIZAR BAJO SEDACION."}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '17/26/27/36/37', 5, 15900.00, 0.00, 15900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '46/47/24', 3, 9540.00, 0.00, 9540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 32, 3640.00, 1.00, '14', 1, 3640.00, 0.00, 3640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2690.00, 1.00, '46/47/26', 3, 8070.00, 0.00, 8070.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '34/35/44/45/15', 5, 5050.00, 0.00, 5050.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 8000.00, 1.00, '16', 1, 8000.00, 0.00, 8000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '16', 1, 1750.00, 0.00, 1750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4150.00, 1.00, '16', 1, 4150.00, 0.00, 4150.00, false);

    -- Paciente 1813 | Fecha: 2017-10-11 | Total: 49600.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1813, 1, '2017-10-11', 49600.00, '{"B":"ES POSIBLE REALIZAR GINGIVOPLASTIA EN ELEMENTOS DENTALES 11/21"}', 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 8000.00, 1.00, '35/46', 2, 16000.00, 0.00, 16000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '35/46', 2, 3500.00, 0.00, 3500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4150.00, 1.00, '35/46', 2, 8300.00, 0.00, 8300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 249, 640.00, 1.00, '11/21', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1530.00, 1.00, '11/21', 2, 3060.00, 0.00, 3060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3950.00, 1.00, '11/21', 2, 7900.00, 0.00, 7900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 214, 9560.00, 1.00, NULL, 1, 9560.00, 0.00, 9560.00, false);

    -- Paciente 2361 | Fecha: 2019-10-08 | Total: 6870.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2361, 1, '2019-10-08', 6870.00, '{"A":"SE SUGIERE REALIZAR CARIOLOGIA PRIORIZANDO LOS DIENTES MAS AFECTADOS\r\nCADA TRATAMIENTO NECESITA CONTROL Y MANTENIMIENTO EN CONUNTO CON UNA LIMPIEZA DENTARIA CADA 6 MESES"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '17-16-27-28-37-46', 6, 3840.00, 0.00, 3840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '36-37-26', 3, 3030.00, 0.00, 3030.00, false);

    -- Paciente 2051 | Fecha: 2019-10-23 | Total: 11340.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2051, 1, '2019-10-23', 11340.00, NULL, 7)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 3310.00, 1.00, '16', 1, 3310.00, 0.00, 3310.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 2430.00, 1.00, '13', 1, 2430.00, 0.00, 2430.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2800.00, 1.00, '22-23', 2, 5600.00, 0.00, 5600.00, false);

    -- Paciente 2051 | Fecha: 2019-10-23 | Total: 206040.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2051, 1, '2019-10-23', 206040.00, NULL, 7)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 3310.00, 1.00, '16', 1, 3310.00, 0.00, 3310.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 2430.00, 1.00, '13-43', 2, 4860.00, 0.00, 4860.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2800.00, 1.00, '22-23', 2, 5600.00, 0.00, 5600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 640.00, 1.00, '22-23', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '16-13-22-23-26', 5, 7650.00, 0.00, 7650.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '14-15-12-11-21', 5, 5050.00, 0.00, 5050.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '31--32', 2, 2020.00, 0.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3950.00, 1.00, '16-26', 2, 7900.00, 0.00, 7900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3950.00, 1.00, '13-12-11-21-22-23', 6, 23700.00, 0.00, 23700.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 212, 8280.00, 1.00, NULL, 2, 16560.00, 0.00, 16560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '34-44', 2, 6360.00, 0.00, 6360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '43', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '33', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 158, 3310.00, 1.00, '16', 1, 3310.00, 0.00, 3310.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 162, 2430.00, 1.00, '13-43', 2, 4860.00, 0.00, 4860.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 159, 2800.00, 1.00, '22-23', 2, 5600.00, 0.00, 5600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 210, 640.00, 1.00, '22-23', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1530.00, 1.00, '16-13-22-23-26', 5, 7650.00, 0.00, 7650.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '14-15-12-11-21', 5, 5050.00, 0.00, 5050.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '32-31', 2, 2020.00, 0.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3950.00, 1.00, '16-26', 2, 7900.00, 0.00, 7900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3950.00, 1.00, '13-12-11-21-22-23', 6, 23700.00, 0.00, 23700.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '14-14-24-25', 4, 28000.00, 0.00, 28000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1530.00, 1.00, '14-15-24-25', 4, 6120.00, 0.00, 6120.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 4150.00, 1.00, '14-15-24-25', 4, 16600.00, 0.00, 16600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '34-44', 2, 6360.00, 0.00, 6360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 640.00, 1.00, '33', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1010.00, 1.00, '43', 1, 1010.00, 0.00, 1010.00, false);

    -- Paciente 2051 | Fecha: 2023-11-28 | Total: 3040.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2051, 1, '2023-11-28', 3040.00, '{"A":"EL SIGUIENTE TRATAMIENTO ES UNA ALTERNATIVA TEMPORAL HASTA QUE EL PACIENTE INICIE TRATAMIENTO DE DE IMPLANTE Y PROTESIS HIBRIDA SOBRE IMPLANTES EN MAXILAR SUPERIOR"}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 239, 3040.00, 1.00, NULL, 1, 3040.00, 0.00, 3040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 381, 350.00, 1.00, '13/21/22/23', 4, 1400.00, 100.00, 0.00, false);

    -- Paciente 810 | Fecha: 2022-01-11 | Total: 93410.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (810, 1, '2022-01-11', 93410.00, '{"B":"EXISTE POSIBILIDAD DE REHACER PROTESIS INFERIOR CON GANCHO BS. 8600.\r\nCORONA CEROMERO PZA.33 BS. 2500"}', 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '43/42/41/31/32', 5, 5050.00, 0.00, 5050.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '33/34', 2, 2020.00, 0.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '47/45/42/31/33/34', 6, 42000.00, 0.00, 42000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 327, 2310.00, 1.00, '47/45/42/31/33/34', 6, 13860.00, 0.00, 13860.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 323, 21000.00, 1.00, NULL, 1, 21000.00, 0.00, 21000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 239, 2550.00, 1.00, NULL, 1, 2550.00, 0.00, 2550.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 326, 850.00, 1.00, NULL, 1, 850.00, 0.00, 850.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 24, 200.00, 1.00, NULL, 1, 200.00, 0.00, 200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 171, 2670.00, 1.00, '33', 1, 2670.00, 0.00, 2670.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1530.00, 1.00, '33', 1, 1530.00, 0.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 347, 1680.00, 1.00, NULL, 1, 1680.00, 0.00, 1680.00, false);

    -- Paciente 810 | Fecha: 2023-09-05 | Total: 177258.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (810, 1, '2023-09-05', 177258.00, '{"A":"REHABILITACION DE SECTOR 1 CON REPARACION DE PORCELANA, USANDO BARRA ACTUAL","B":"REHABILITACION DE SECTOR 1 HACIENDO TODO NUEVO. PUEDE HABER LIGERA DIFERENCIA DE COLOR EN RELACION A SECTOR 2.","C":"REHABILITACION DE MAXILAR SUPERIOR TOTAL"}', 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 321, 700.00, 1.00, '11/12/14/15', 4, 2800.00, 0.00, 2800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '11/12/13/14/15/16', 6, 3840.00, 0.00, 3840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 327, 2310.00, 1.00, '11/12/14/15', 4, 9240.00, 0.00, 9240.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 5000.00, 1.00, '11/12/14/15', 4, 20000.00, 0.00, 20000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3950.00, 1.00, '13/16', 2, 7900.00, 0.00, 7900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 219, 530.00, 1.00, '11/12/13/14/15/16', 6, 3180.00, 0.00, 3180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 312, 770.00, 1.00, '11/12/14/15', 4, 3080.00, 0.00, 3080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 321, 700.00, 1.00, '11/12/14/15', 4, 2800.00, 0.00, 2800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 640.00, 1.00, '11/12/13/14/15/16', 6, 3840.00, 0.00, 3840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 327, 2310.00, 1.00, '11/12/14/15', 4, 9240.00, 0.00, 9240.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 5000.00, 1.00, '11/12/14/15', 4, 20000.00, 0.00, 20000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3950.00, 1.00, '13/16', 2, 7900.00, 0.00, 7900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 219, 530.00, 1.00, '11/12/13/14/15/16', 6, 3180.00, 0.00, 3180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 295, 4550.00, 1.00, NULL, 1, 4550.00, 0.00, 4550.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 321, 700.00, 1.00, '11/12/14/15', 4, 2800.00, 20.00, 2240.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 321, 700.00, 1.00, '21/24/25', 3, 2100.00, 20.00, 1680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 183, 640.00, 1.00, '11/12/13/14/15/16', 6, 3840.00, 20.00, 3072.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 183, 640.00, 1.00, '21/22/23/24/25', 5, 3200.00, 20.00, 2560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 327, 2310.00, 1.00, '11/12/14/15', 4, 9240.00, 15.00, 7854.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 327, 2310.00, 1.00, '21/24/25', 3, 6930.00, 15.00, 5890.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 294, 5000.00, 1.00, '11/12/14/15', 4, 20000.00, 15.00, 17000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 294, 5000.00, 1.00, '21/24/25', 3, 15000.00, 15.00, 12750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 185, 3950.00, 1.00, '13/16/22/23', 4, 15800.00, 15.00, 13430.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 219, 530.00, 1.00, '11/12/13/14/15/16', 6, 3180.00, 20.00, 2544.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 219, 530.00, 1.00, '21/22/23/24/25', 5, 2650.00, 20.00, 2120.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 295, 4550.00, 1.00, NULL, 1, 4550.00, 15.00, 3867.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 345, 1400.00, 1.00, NULL, 1, 1400.00, 50.00, 700.00, false);

    -- Paciente 2864 | Fecha: 2024-05-14 | Total: 169910.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2864, 1, '2024-05-14', 169910.00, '{"A":"SE EVALUARA RELLENO OSEO EN AREA DE EXODONCIAS, PARA REHABILITACION CON IMPLANTES.","B":"SE EVALUARA EVOLUCION, POSIBLE EXODONCIAS DE ELEMENTOS DENTALES."}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '12/11/21/22', 4, 4040.00, 0.00, 4040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '37/36/32/31/41/42', 6, 6060.00, 0.00, 6060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '12/11/21/22/24/25', 6, 42000.00, 0.00, 42000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '37/36/32/31/41/42', 6, 42000.00, 0.00, 42000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1400.00, 1.00, '12/11/21/22/24/25', 6, 8400.00, 0.00, 8400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1400.00, 1.00, '37/36/32/31/41/42', 6, 8400.00, 0.00, 8400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 311, 4000.00, 1.00, '12/11/21/22/24/25', 6, 24000.00, 0.00, 24000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 333, 3000.00, 1.00, '37/36/32/31/41/42', 6, 18000.00, 0.00, 18000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 239, 2550.00, 1.00, NULL, 2, 5100.00, 0.00, 5100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1400.00, 1.00, NULL, 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 32, 3870.00, 1.00, '24', 1, 3870.00, 0.00, 3870.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 249, 640.00, 1.00, '37', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 241, 3000.00, 1.00, '36/37', 2, 6000.00, 0.00, 6000.00, false);

    -- Paciente 2864 | Fecha: 2024-08-29 | Total: 183650.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2864, 1, '2024-08-29', 183650.00, '{"A":"PRIMERA FASE","B":"FASE 2"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '37/36/32/31/41/42', 6, 6060.00, 0.00, 6060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 82, 3830.00, 1.00, NULL, 2, 7660.00, 0.00, 7660.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 267, 2500.00, 1.00, NULL, 1, 2500.00, 0.00, 2500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '44', 1, 1530.00, 0.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 2470.00, 1.00, '45', 1, 2470.00, 0.00, 2470.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2870.00, 1.00, '46', 1, 2870.00, 0.00, 2870.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '44-45', 2, 3060.00, 0.00, 3060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1100.00, 1.00, '46', 1, 1100.00, 0.00, 1100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 3000.00, 1.00, '44-45-46', 3, 9000.00, 0.00, 9000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '34-33-43', 3, 3150.00, 0.00, 3150.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '37-36-32-31-41-42', 6, 42000.00, 0.00, 42000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1400.00, 1.00, '37-36-32-31-41-42', 6, 8400.00, 0.00, 8400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 311, 4000.00, 1.00, '37-36-32-31-41-42', 6, 24000.00, 0.00, 24000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 24, 400.00, 1.00, NULL, 1, 400.00, 0.00, 400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 326, 850.00, 1.00, NULL, 1, 850.00, 0.00, 850.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 34, 1010.00, 1.00, '11-12-21-22', 4, 4040.00, 0.00, 4040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 82, 3830.00, 1.00, '12-11-21-22', 1, 3830.00, 0.00, 3830.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 221, 2500.00, 1.00, NULL, 1, 2500.00, 0.00, 2500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 326, 850.00, 1.00, NULL, 1, 850.00, 0.00, 850.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 292, 7000.00, 1.00, '12-11-21-22', 4, 28000.00, 0.00, 28000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'E', 293, 1400.00, 1.00, '12-11-21-22', 4, 5600.00, 0.00, 5600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'E', 311, 4000.00, 1.00, '12-11-21-22', 4, 16000.00, 0.00, 16000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'E', 115, 3190.00, 1.00, '13-23', 2, 6380.00, 0.00, 6380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'E', 345, 1400.00, 1.00, NULL, 1, 1400.00, 0.00, 1400.00, false);

    -- Paciente 1441 | Fecha: 2019-12-10 | Total: 54270.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1441, 1, '2019-12-10', 54270.00, NULL, 12)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '36/37/46/47', 4, 28000.00, 0.00, 28000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '36/37/46/47', 4, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4150.00, 1.00, '36/37/46/47', 4, 16600.00, 0.00, 16600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 237, 2670.00, 1.00, NULL, 1, 2670.00, 0.00, 2670.00, false);

    -- Paciente 650 | Fecha: 2019-12-23 | Total: 2670.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (650, 1, '2019-12-23', 2670.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 237, 2670.00, 1.00, NULL, 1, 2670.00, 0.00, 2670.00, false);

    -- Paciente 64 | Fecha: 2023-02-02 | Total: 13480.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (64, 1, '2023-02-02', 13480.00, NULL, 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 37, 1280.00, 1.00, '25/26', 2, 2560.00, 0.00, 2560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 93, 5460.00, 1.00, '25/26', 2, 10920.00, 0.00, 10920.00, false);

    -- Paciente 2774 | Fecha: 2023-02-23 | Total: 15910.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2774, 1, '2023-02-23', 15910.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 171, 2670.00, 1.00, '11', 1, 2670.00, 0.00, 2670.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1400.00, 1.00, '11', 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 171, 2670.00, 1.00, '11', 1, 2670.00, 0.00, 2670.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 177, 4000.00, 1.00, '11', 1, 4000.00, 0.00, 4000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 171, 2670.00, 1.00, '11', 1, 2670.00, 0.00, 2670.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 241, 2500.00, 1.00, '11', 1, 2500.00, 0.00, 2500.00, false);

    -- Paciente 2774 | Fecha: 2023-02-23 | Total: 760.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2774, 1, '2023-02-23', 760.00, NULL, 22)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 165, 760.00, 1.00, '11', 1, 760.00, 0.00, 760.00, false);

    -- Paciente 507 | Fecha: 2023-02-27 | Total: 8848.50
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (507, 1, '2023-02-27', 8848.50, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 236, 1810.00, 1.00, NULL, 1, 1810.00, 15.00, 1538.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 212, 8600.00, 1.00, NULL, 1, 8600.00, 15.00, 7310.00, false);

    -- Paciente 135 | Fecha: 2023-03-09 | Total: 12400.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (135, 1, '2023-03-09', 12400.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '25', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1400.00, 1.00, '25', 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 311, 4000.00, 1.00, '25', 1, 4000.00, 0.00, 4000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2701 | Fecha: 2023-04-05 | Total: 5100.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2701, 1, '2023-04-05', 5100.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 132, 350.00, 1.00, '31-32-41-42-21-11', 6, 2100.00, 0.00, 2100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 138, 3000.00, 1.00, NULL, 1, 3000.00, 0.00, 3000.00, false);

    -- Paciente 167 | Fecha: 2023-04-06 | Total: 77760.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (167, 1, '2023-04-06', 77760.00, '{"A":"POSIBLE TRATAMIENTO DE ENDODONCIA EN DIENTES ANTERIORES.\r\nSI PACIENTE REQUIERE ESTETICA GINGIVAL SE DEBE HACER PLASTIA."}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4400.00, 1.00, '11/12/21/22/23/13', 6, 26400.00, 0.00, 26400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 3300.00, 1.00, '14/15/16/45', 4, 13200.00, 0.00, 13200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 3510.00, 1.00, '24/25', 2, 7020.00, 0.00, 7020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 131, 850.00, 1.00, NULL, 1, 850.00, 0.00, 850.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 275, 850.00, 1.00, NULL, 1, 850.00, 0.00, 850.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3500.00, 1.00, '34/35/17', 3, 10500.00, 0.00, 10500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3500.00, 1.00, '44/46/47', 3, 10500.00, 0.00, 10500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1540.00, 1.00, NULL, 1, 1540.00, 0.00, 1540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1150.00, 1.00, '33-32-31-41-42-43', 6, 6900.00, 0.00, 6900.00, false);

    -- Paciente 582 | Fecha: 2017-02-14 | Total: 1215.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (582, 1, '2017-02-14', 1215.00, NULL, 7)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 244, 1215.00, 1.00, NULL, 1, 1215.00, 0.00, 1215.00, false);

    -- Paciente 1950 | Fecha: 2017-04-24 | Total: 53860.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1950, 1, '2017-04-24', 53860.00, '{"A":"ELEMENTOS DENTARIOS 26/27 TRATAMIENTO FINAL: CORONAS DE METAL PORCELANA BS 4400.- CADA UNA.\r\nPOSIBLE EXODONCIA ELEMENTOS DENTARIOS 26/27 BS. 920.- CADA UNA"}', 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2440.00, 1.00, '26/27/16', 3, 7320.00, 0.00, 7320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 580.00, 1.00, '26/27', 2, 1160.00, 0.00, 1160.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 920.00, 1.00, '26/27', 2, 1840.00, 0.00, 1840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 239, 2320.00, 1.00, NULL, 1, 2320.00, 0.00, 2320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '16', 1, 2890.00, 0.00, 2890.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 920.00, 1.00, '26/27', 2, 1840.00, 0.00, 1840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 82, 3480.00, 1.00, '26/27', 1, 3480.00, 0.00, 3480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 8110.00, 1.00, '26/27', 2, 16220.00, 0.00, 16220.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 2900.00, 1.00, '26/27', 2, 5800.00, 0.00, 5800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 4630.00, 1.00, '26/27', 2, 9260.00, 0.00, 9260.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 203, 1730.00, 1.00, NULL, 1, 1730.00, 0.00, 1730.00, false);

    -- Paciente 1899 | Fecha: 2018-04-16 | Total: 35569.20
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1899, 1, '2018-04-16', 35569.20, '{"B":"PROMOCION 500$ IMPLANTE + MUÑON + CORONA POR CADA ELEMENTO DENTAL, PAGO UNICO EL DIA DE LA CIRUGIA."}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 1890.00, 1.00, '13/12/11/21/22/23', 6, 11340.00, 43.00, 6463.80, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '35/36', 2, 14000.00, 65.00, 4900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '13/12/11/21/22/23', 6, 34140.00, 44.00, 19118.40, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '35/36', 2, 2020.00, 50.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1750.00, 1.00, '35/36', 2, 3500.00, 85.00, 525.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 4150.00, 1.00, '35/36', 2, 8300.00, 81.00, 1577.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3950.00, 1.00, '34', 1, 3950.00, 50.00, 1975.00, false);

    -- Paciente 162 | Fecha: 2018-06-06 | Total: 8300.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (162, 1, '2018-06-06', 8300.00, NULL, 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '11', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '17', 1, 3180.00, 0.00, 3180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 640.00, 1.00, '13/15/16/', 3, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 640.00, 1.00, '43/44/45/46', 4, 2560.00, 0.00, 2560.00, false);

    -- Paciente 2166 | Fecha: 2018-07-02 | Total: 3190.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2166, 1, '2018-07-02', 3190.00, NULL, 13)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 45, 3190.00, 1.00, '46', 1, 3190.00, 0.00, 3190.00, false);

    -- Paciente 884 | Fecha: 2018-07-09 | Total: 48860.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (884, 1, '2018-07-09', 48860.00, NULL, 7)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 114, 1900.00, 1.00, '13-12-11-21-22-23', 6, 11400.00, 0.00, 11400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '43-42-41-31-32-33', 6, 3840.00, 0.00, 3840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '14-16-17', 3, 9540.00, 0.00, 9540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '35-34-45-46', 4, 12720.00, 0.00, 12720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '14-24-25-26-27', 5, 3200.00, 0.00, 3200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '36-44-47', 3, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2690.00, 1.00, '47', 1, 2690.00, 0.00, 2690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '37', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '48', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 203, 1900.00, 1.00, NULL, 1, 1900.00, 0.00, 1900.00, false);

    -- Paciente 2177 | Fecha: 2018-07-10 | Total: 7140.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2177, 1, '2018-07-10', 7140.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 283, 510.00, 1.00, '18/17/16/15/14/24', 6, 3060.00, 0.00, 3060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 283, 510.00, 1.00, '25/28/37/36/44/45', 6, 3060.00, 0.00, 3060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 283, 510.00, 1.00, '46/47', 2, 1020.00, 0.00, 1020.00, false);

    -- Paciente 2183 | Fecha: 2018-07-12 | Total: 4420.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2183, 1, '2018-07-12', 4420.00, NULL, 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 221, 3040.00, 1.00, NULL, 1, 3040.00, 0.00, 3040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 2, 370.00, 1.00, NULL, 1, 370.00, 0.00, 370.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 235, 640.00, 1.00, NULL, 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 2, 370.00, 1.00, NULL, 1, 370.00, 0.00, 370.00, false);

    -- Paciente 1084 | Fecha: 2018-07-17 | Total: 6290.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1084, 1, '2018-07-17', 6290.00, '{"A":"BLANQUEAMIENDO WHITNESS EN STRIPS"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 123, 1760.00, 1.00, NULL, 1, 1760.00, 0.00, 1760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 283, 510.00, 1.00, '15-14-24-25', 4, 2040.00, 0.00, 2040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '13-23', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1210.00, 1.00, NULL, 1, 1210.00, 0.00, 1210.00, false);

    -- Paciente 231 | Fecha: 2015-09-16 | Total: 44660.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (231, 1, '2015-09-16', 44660.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 3480.00, 1.00, '13/12/11/21/22/23', 6, 20880.00, 0.00, 20880.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 86, 580.00, 1.00, '11/12/21', 3, 1740.00, 0.00, 1740.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 84, 1450.00, 1.00, '12', 1, 1450.00, 0.00, 1450.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 2900.00, 1.00, '13/12/11/21/22/23', 6, 17400.00, 0.00, 17400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 86, 580.00, 1.00, '11/12/21', 3, 1740.00, 0.00, 1740.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 84, 1450.00, 1.00, '12', 1, 1450.00, 0.00, 1450.00, false);

    -- Paciente 1659 | Fecha: 2015-09-17 | Total: 3680.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1659, 1, '2015-09-17', 3680.00, NULL, 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 283, 460.00, 1.00, '54/55/64/65', 4, 1840.00, 0.00, 1840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 283, 460.00, 1.00, '74/75/84/85', 4, 1840.00, 0.00, 1840.00, false);

    -- Paciente 1655 | Fecha: 2015-09-23 | Total: 2640.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1655, 1, '2015-09-23', 2640.00, '{"A":"EVALUAR PIEZA 36 CON RX,POSIBLE OPERATIRIA O INCRUSTACION"}', 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 381, 190.00, 1.00, '17/27', 2, 380.00, 0.00, 380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '26/35/37', 2, 1160.00, 0.00, 1160.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1100.00, 1.00, NULL, 1, 1100.00, 0.00, 1100.00, false);

    -- Paciente 1661 | Fecha: 2015-09-28 | Total: 62340.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1661, 1, '2015-09-28', 62340.00, '{"A":"TOTAL TRATAMIENTO CON DESCUENTO: 17500.- BS.","B":"TOTAL TRATAMIENTO CON DESCUENTO: 24837.- BS."}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 920.00, 1.00, '36/46', 2, 1840.00, 0.00, 1840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 8110.00, 1.00, '36/46', 2, 16220.00, 0.00, 16220.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2900.00, 1.00, '36/46', 2, 5800.00, 0.00, 5800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4630.00, 1.00, '36/46', 2, 9260.00, 0.00, 9260.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 218, 4870.00, 1.00, '11/12/13/21/22/23', 6, 29220.00, 0.00, 29220.00, false);

    -- Paciente 680 | Fecha: 2015-10-07 | Total: 23380.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (680, 1, '2015-10-07', 23380.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 3480.00, 1.00, '41/42/31/32', 4, 13920.00, 30.00, 9744.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 218, 4870.00, 1.00, '4/42/31/32', 4, 19480.00, 30.00, 13636.00, false);

    -- Paciente 1588 | Fecha: 2015-05-26 | Total: 27800.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1588, 1, '2015-05-26', 27800.00, '{"A":"POSIBLE ENDODONCIA EN PIEZA 24 BS 2310"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 2210.00, 1.00, '15', 1, 2210.00, 0.00, 2210.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '15-24', 2, 5780.00, 0.00, 5780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '35-36-47', 3, 4170.00, 0.00, 4170.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '35-36-47', 3, 13200.00, 0.00, 13200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2440.00, 1.00, '36', 1, 2440.00, 0.00, 2440.00, false);

    -- Paciente 1648 | Fecha: 2015-09-03 | Total: 9260.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1648, 1, '2015-09-03', 9260.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1100.00, 1.00, NULL, 1, 1100.00, 0.00, 1100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1130.00, 1.00, '15-16', 2, 2260.00, 0.00, 2260.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '36-37', 2, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '25', 1, 4400.00, 0.00, 4400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '46', 1, 580.00, 0.00, 580.00, false);

    -- Paciente 1758 | Fecha: 2016-03-23 | Total: 80350.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1758, 1, '2016-03-23', 80350.00, '{"A":"PLAN DE TRATAMIENTO DEL MAXILAR SUPERIOR"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 8110.00, 1.00, '11-13-15-21-23-25', 6, 48660.00, 0.00, 48660.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2900.00, 1.00, '11-13-15-21-23-25', 6, 17400.00, 0.00, 17400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 295, 4140.00, 1.00, '11-13-15-21-23-25', 1, 4140.00, 0.00, 4140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 382, 10150.00, 1.00, NULL, 1, 10150.00, 0.00, 10150.00, false);

    -- Paciente 1758 | Fecha: 2016-03-23 | Total: 80350.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1758, 1, '2016-03-23', 80350.00, '{"B":"PLAN DE TRATAMIENTO  DEL MAXILAR INFERIOR"}', 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 8110.00, 1.00, '31-33-35-41-43-45', 6, 48660.00, 0.00, 48660.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 2900.00, 1.00, '31-33-35-41-43-45', 6, 17400.00, 0.00, 17400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 295, 4140.00, 1.00, '31-33-35-41-43-45', 1, 4140.00, 0.00, 4140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 382, 10150.00, 1.00, NULL, 1, 10150.00, 0.00, 10150.00, false);

    -- Paciente 517 | Fecha: 2022-07-22 | Total: 21522.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (517, 1, '2022-07-22', 21522.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '12-11-21-22', 4, 2560.00, 15.00, 2176.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 5690.00, 1.00, '12-11-21-22', 4, 22760.00, 15.00, 19346.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 272, 800.00, 1.00, NULL, 1, 800.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 215 | Fecha: 2017-06-29 | Total: 3472.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (215, 1, '2017-06-29', 3472.00, NULL, 7)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 86, 640.00, 1.00, '24-25', 2, 1280.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '24-25', 2, 3060.00, 20.00, 2448.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '24-25', 2, 1280.00, 20.00, 1024.00, false);

    -- Paciente 215 | Fecha: 2022-07-04 | Total: 28830.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (215, 1, '2022-07-04', 28830.00, '{"A":"LA SIGUIENTE PROPUESTA , NO INCLUYE ALTERNATIVA DE IMPLANTES.\r\nLOS MATERIALES SELECCIONADOS PARA ESTE TRATAMIENTO  HAN SIDO SELECCIONADOS DE ACUERDO A SU OCLUSION ACTUAL."}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '19/15/14', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1100.00, 1.00, '14/16', 2, 2200.00, 0.00, 2200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 195, 2700.00, 1.00, '16/15/14', 3, 8100.00, 0.00, 8100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 2500.00, 1.00, '24/25', 2, 5000.00, 0.00, 5000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2870.00, 1.00, '33', 1, 2870.00, 0.00, 2870.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '33', 1, 1530.00, 0.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '33', 1, 5690.00, 0.00, 5690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 760.00, 1.00, NULL, 1, 760.00, 0.00, 760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1400.00, 1.00, NULL, 1, 1400.00, 0.00, 1400.00, false);

    -- Paciente 215 | Fecha: 2022-07-04 | Total: 55430.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (215, 1, '2022-07-04', 55430.00, '{"B":"EN MAXILAR SUPERIOR IZQUIERDO SE ANALIZARA CON ESTUDIO DE TOMOGRAFIA , POSIBILIDAD DE COLOCAR IMPLANTE"}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 249, 640.00, 1.00, '16/15/14', 3, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3950.00, 1.00, '16/14', 2, 7900.00, 0.00, 7900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 224, 1100.00, 1.00, '14/16', 2, 2200.00, 0.00, 2200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '15/22/46', 3, 21000.00, 0.00, 21000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1750.00, 1.00, '15/22/46', 3, 5250.00, 0.00, 5250.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 5000.00, 1.00, '15/22/46', 3, 15000.00, 0.00, 15000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 79, 760.00, 1.00, NULL, 1, 760.00, 0.00, 760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 345, 1400.00, 1.00, NULL, 1, 1400.00, 0.00, 1400.00, false);

    -- Paciente 2720 | Fecha: 2022-07-12 | Total: 61880.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2720, 1, '2022-07-12', 61880.00, '{"A":"SE RECOMIENDA EXTRACCION E IMPLANTE DE 16 (MOLAR SUPEIOR DERECHO )"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 81, 1400.00, 1.00, NULL, 2, 2800.00, 0.00, 2800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '12-21-22', 3, 3030.00, 0.00, 3030.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 24, 200.00, 1.00, NULL, 1, 200.00, 0.00, 200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 326, 850.00, 1.00, NULL, 1, 850.00, 0.00, 850.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '12-11-21-22', 4, 28000.00, 0.00, 28000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '12-11-21-22', 4, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 5000.00, 1.00, '12-11-21-22', 4, 20000.00, 0.00, 20000.00, false);

    -- Paciente 1968 | Fecha: 2021-09-30 | Total: 4000.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1968, 1, '2021-09-30', 4000.00, NULL, 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 111, 2000.00, 1.00, NULL, 2, 4000.00, 0.00, 4000.00, false);

    -- Paciente 1968 | Fecha: 2021-09-30 | Total: 7600.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1968, 1, '2021-09-30', 7600.00, NULL, 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 123, 1800.00, 1.00, NULL, 2, 3600.00, 0.00, 3600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 111, 2000.00, 1.00, NULL, 2, 4000.00, 0.00, 4000.00, false);

    -- Paciente 1968 | Fecha: 2023-08-04 | Total: 32210.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1968, 1, '2023-08-04', 32210.00, '{"A":"POSIBLE TRATAMIENTO DE CONDUCTOS DE SECTOR ANTERO SUPERIO EN CASO DE HIPERSENSIBILIDAD. \r\nCOSTO BS. 2470. CADA UNO."}', 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 131, 770.00, 1.00, NULL, 1, 770.00, 0.00, 770.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '21', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1100.00, 1.00, '21', 1, 1100.00, 0.00, 1100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4000.00, 1.00, '13-12-11-22-23', 5, 20000.00, 0.00, 20000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 218, 4000.00, 1.00, '21', 1, 4000.00, 0.00, 4000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1400.00, 1.00, NULL, 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '33/32/31/41/42/', 5, 3250.00, 0.00, 3250.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '14', 1, 1050.00, 0.00, 1050.00, false);

    -- Paciente 964 | Fecha: 2021-10-06 | Total: 72536.40
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (964, 1, '2021-10-06', 72536.40, '{"A":"EXISTE POSIBILIDAD DE REALIZAR TRATAMIENTO DE ENDODONCIA EN DIENTES MUY SENSIBLES (CANINO SUPERIOR IZQUIERDO)\r\nSE RECOMIENDA BLANQUEAMIENTO EN ARCADA INFERIOR PARA ARMONICAR EL COLOR\r\nDEBE CANCELAR EL 50% DE INICIO EN TRABAJOS DE LABORATORIO.","B":"EXISTE POSIBILIDAD DE REALIZAR TRATAMIENTO DE ENDODONCIA EN DIENTES MUY SENSIBLES (CANINO SUPERIOR IZQUIERDO)\r\nSE RECOMIENDA BLANQUEAMIENTO EN ARCADA INFERIOR PARA ARMONICAR EL COLOR"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 245, 5690.00, 1.00, '14-13-12-11-23-24', 6, 34140.00, 13.00, 29701.80, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '21-22', 2, 11380.00, 13.00, 9900.60, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3190.00, 1.00, '14-13-12-11-23-24', 6, 19140.00, 0.00, 19140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3190.00, 1.00, '21-22', 2, 6380.00, 0.00, 6380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 760.00, 1.00, NULL, 1, 760.00, 30.00, 532.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1210.00, 1.00, NULL, 1, 1210.00, 30.00, 847.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 92, 2550.00, 1.00, NULL, 1, 2550.00, 70.00, 765.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 79, 760.00, 1.00, NULL, 1, 760.00, 0.00, 760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 345, 1210.00, 1.00, NULL, 1, 1210.00, 0.00, 1210.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 92, 2550.00, 1.00, NULL, 1, 2550.00, 0.00, 2550.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 138, 2500.00, 1.00, NULL, 1, 2500.00, 70.00, 750.00, false);

    -- Paciente 964 | Fecha: 2023-07-07 | Total: 3190.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (964, 1, '2023-07-07', 3190.00, '{"A":"PLACA NFERIOR PARA CORREGIR, INCISIVO INFERIOR VESTIBULARIZADO"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 228, 3190.00, 1.00, NULL, 1, 3190.00, 0.00, 3190.00, false);

    -- Paciente 441 | Fecha: 2016-03-28 | Total: 51990.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (441, 1, '2016-03-28', 51990.00, '{"A":"POSIBLE TRATAMIENTO ENDODONTICO EN ELEMENTO DENTARIO 46 B$ \r\nTODA PREPARACION DE INCRUSTACION EXISTE LA POSIBILIDAD DE SENSIBILIDADPOST OPERATORIA DE ACUERDO A LA INTENSIDAD, DEBERA REALIZARSE UN TRATAMIENTO DE CONDUCTO."}', 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '17-16-15-14', 4, 11560.00, 0.00, 11560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '27-26-25', 3, 8670.00, 0.00, 8670.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '13-12-22-23', 4, 2320.00, 0.00, 2320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 199, 3480.00, 1.00, '37-36-35-34', 4, 13920.00, 0.00, 13920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 199, 3480.00, 1.00, '44-45-46', 3, 10440.00, 0.00, 10440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '33-32-31-41-42-43', 6, 3480.00, 0.00, 3480.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 111, 1600.00, 1.00, NULL, 1, 1600.00, 0.00, 1600.00, false);

    -- Paciente 106 | Fecha: 2016-04-07 | Total: 3200.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (106, 1, '2016-04-07', 3200.00, NULL, 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 111, 1600.00, 1.00, NULL, 2, 3200.00, 0.00, 3200.00, false);

    -- Paciente 1591 | Fecha: 2016-04-07 | Total: 53760.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1591, 1, '2016-04-07', 53760.00, NULL, 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '17/16/15/13/23/25', 6, 17340.00, 0.00, 17340.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '26/27/33/34/35/36', 6, 17340.00, 0.00, 17340.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '37/43/44/45/47/', 5, 14450.00, 0.00, 14450.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4630.00, 1.00, '46', 1, 4630.00, 0.00, 4630.00, false);

    -- Paciente 2873 | Fecha: 2024-04-16 | Total: 72810.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2873, 1, '2024-04-16', 72810.00, '{"A":"POSIBLE TRATAMIENTO DE ENDODONCIA 27 (SEGUNDO MOLAR IZQUIERDO SUPERIOR) POR CARIES PROFUNDA,  42-31 (INCISIVOS INFERIORES), PRESENTAN CORONA SIN ENDODDONCIA"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '17-16-27-26', 4, 12720.00, 0.00, 12720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '15-25-13-23-21-11', 6, 6300.00, 0.00, 6300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '33-32-43', 3, 1950.00, 0.00, 1950.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '31-41-42', 3, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1100.00, 1.00, '31-41-42', 3, 3300.00, 0.00, 3300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '31-41-42', 3, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 3000.00, 1.00, '31-41-42', 3, 9000.00, 0.00, 9000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 145, 770.00, 1.00, NULL, 1, 770.00, 0.00, 770.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '15-25', 2, 6360.00, 0.00, 6360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '17-16-27-26', 4, 12720.00, 0.00, 12720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 135, 2100.00, 1.00, '13-12-11-21-22-23', 6, 12600.00, 0.00, 12600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 145, 770.00, 1.00, NULL, 1, 770.00, 0.00, 770.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1240.00, 1.00, '24-14', 2, 2480.00, 0.00, 2480.00, false);

    -- Paciente 2873 | Fecha: 2024-07-29 | Total: 40020.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2873, 1, '2024-07-29', 40020.00, '{"A":"PRIMERA FASE, QUIRURGICA, PACIENTE ESTARA SIN DIENTES EL EL SECTOR 2 MESES POR REMODELACION OSEA.","B":"FASE 2 QUIRURGICA, SE VALORARA LA NECESIDAD DE RETIRAR EL IMPLANTE O MANTENERLO DE ACUERDO A EVOLUCION","C":"PROPUESTA SI EL IMPLANTE 45 PRIMER PREMOLAR INFERIOR DERECHO ESTA COMPROMETIDO"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 303, 1770.00, 1.00, '45-47', 2, 3540.00, 0.00, 3540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 325, 1400.00, 1.00, '46', 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 82, 3830.00, 1.00, '45-46-47', 1, 3830.00, 0.00, 3830.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '46', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 311, 4000.00, 1.00, '45-46-47', 3, 12000.00, 0.00, 12000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1400.00, 1.00, '46', 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 325, 1400.00, 1.00, '45', 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 292, 7000.00, 1.00, '45', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 293, 1400.00, 1.00, '45', 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 24, 400.00, 1.00, '45-46-47', 1, 400.00, 0.00, 400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 310, 650.00, 1.00, '46', 1, 650.00, 0.00, 650.00, false);

    -- Paciente 432 | Fecha: 2024-07-29 | Total: 18910.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (432, 1, '2024-07-29', 18910.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '24', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1400.00, 1.00, '24', 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 311, 4000.00, 1.00, '24', 1, 4000.00, 0.00, 4000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 310, 650.00, 1.00, '24', 1, 650.00, 0.00, 650.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 24, 400.00, 1.00, '24', 1, 400.00, 0.00, 400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 93, 5460.00, 1.00, '24', 1, 5460.00, 0.00, 5460.00, false);

    -- Paciente 432 | Fecha: 2025-03-13 | Total: 5680.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (432, 1, '2025-03-13', 5680.00, NULL, 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 710.00, 1.00, '13/23', 2, 1420.00, 0.00, 1420.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 710.00, 1.00, '46/45/44/34/35/36', 6, 4260.00, 0.00, 4260.00, false);

    -- Paciente 1653 | Fecha: 2015-11-19 | Total: 18940.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1653, 1, '2015-11-19', 18940.00, '{"B":"EL TRATAMIENTO DEPENDE DE LAS RECOMENDACIONES  EXPLICADAS POR EL PROFESIONAL"}', 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 2, 340.00, 1.00, NULL, 1, 340.00, 0.00, 340.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '44/45/24', 3, 2760.00, 0.00, 2760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 2210.00, 1.00, '15', 1, 2210.00, 0.00, 2210.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2550.00, 1.00, '35', 1, 2550.00, 0.00, 2550.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '35', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '35', 1, 4400.00, 0.00, 4400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '36', 1, 2890.00, 0.00, 2890.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 111, 3000.00, 1.00, NULL, 1, 3000.00, 20.00, 2400.00, false);

    -- Paciente 103 | Fecha: 2015-05-14 | Total: 23330.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (103, 1, '2015-05-14', 23330.00, NULL, 7)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 305, 7000.00, 1.00, '16', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2900.00, 1.00, '16', 1, 2900.00, 0.00, 2900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4630.00, 1.00, '16', 1, 4630.00, 0.00, 4630.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 4400.00, 1.00, '17-15', 2, 8800.00, 0.00, 8800.00, false);

    -- Paciente 137 | Fecha: 2015-05-20 | Total: 4380.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (137, 1, '2015-05-20', 4380.00, NULL, 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '18/28', 2, 1840.00, 0.00, 1840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 35, 1270.00, 1.00, '18/28', 2, 2540.00, 0.00, 2540.00, false);

    -- Paciente 804 | Fecha: 2016-06-29 | Total: 37572.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (804, 1, '2016-06-29', 37572.00, NULL, 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 305, 7000.00, 1.00, '31/41/42', 3, 21000.00, 0.00, 21000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2900.00, 1.00, '31/41/42', 3, 8700.00, 0.00, 8700.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 311, 4900.00, 1.00, '31/41/42', 3, 14700.00, 50.00, 7350.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 580.00, 1.00, '31/41/42', 3, 1740.00, 70.00, 522.00, false);

    -- Paciente 804 | Fecha: 2016-06-29 | Total: 27807.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (804, 1, '2016-06-29', 27807.00, NULL, 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 305, 7000.00, 1.00, '31/42', 2, 14000.00, 0.00, 14000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 2900.00, 1.00, '31/42', 2, 5800.00, 0.00, 5800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 311, 4900.00, 1.00, '31/42', 2, 9800.00, 50.00, 4900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5170.00, 1.00, '41', 1, 5170.00, 50.00, 2585.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 580.00, 1.00, '31/41/42', 3, 1740.00, 70.00, 522.00, false);

    -- Paciente 32 | Fecha: 2016-08-22 | Total: 121585.50
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (32, 1, '2016-08-22', 121585.50, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 245, 5170.00, 1.00, '11/12/13/21/22/23', 6, 31020.00, 0.00, 31020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 245, 5170.00, 1.00, '33/32/31/41/42/43', 6, 31020.00, 0.00, 31020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '22/23', 2, 1840.00, 0.00, 1840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1390.00, 1.00, '41', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 114, 1730.00, 1.00, '11/12/13/21/22/23', 6, 10380.00, 0.00, 10380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 114, 1730.00, 1.00, '33/32/31/41/42/43', 6, 10380.00, 0.00, 10380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 115, 2900.00, 1.00, '11/12/13/21/22/23', 6, 17400.00, 15.00, 14790.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 115, 2900.00, 1.00, '31/32/33/41/42/43', 6, 17400.00, 15.00, 14790.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1390.00, 1.00, '41', 1, 1390.00, 0.00, 1390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 920.00, 1.00, '22/23', 2, 1840.00, 0.00, 1840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 201, 1390.00, 1.00, '41', 1, 1390.00, 15.00, 1181.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 117, 920.00, 1.00, '22/23', 2, 1840.00, 15.00, 1564.00, false);

    -- Paciente 1323 | Fecha: 2016-08-30 | Total: 102340.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1323, 1, '2016-08-30', 102340.00, '{"A":"POSIBLE TETRATAMIENDO DE CONDUCTOS PZA 36 BS 3010","B":"POSIBLE RETRATAMIENTO DE CONDUCTO PZA 36 BS 3010"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 690.00, 1.00, NULL, 1, 690.00, 0.00, 690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 111, 1600.00, 1.00, NULL, 2, 3200.00, 0.00, 3200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 86, 580.00, 1.00, '21/12/22', 3, 1740.00, 0.00, 1740.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '17/16/15/24/27', 5, 14450.00, 0.00, 14450.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '35/37/38', 3, 8670.00, 0.00, 8670.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 580.00, 1.00, '15/13/23', 3, 1740.00, 0.00, 1740.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 245, 5170.00, 1.00, '12/11/21/22', 4, 20680.00, 0.00, 20680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 210, 580.00, 1.00, '25', 1, 580.00, 0.00, 580.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 920.00, 1.00, '25', 1, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5170.00, 1.00, '25/36/46/47', 4, 20680.00, 0.00, 20680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '26', 1, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 79, 690.00, 1.00, NULL, 1, 690.00, 0.00, 690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 111, 1600.00, 1.00, NULL, 2, 3200.00, 0.00, 3200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 2890.00, 1.00, '35/37/38', 3, 8670.00, 0.00, 8670.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5170.00, 1.00, '36/46/47', 3, 15510.00, 0.00, 15510.00, false);

    -- Paciente 1323 | Fecha: 2016-08-30 | Total: 690.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1323, 1, '2016-08-30', 690.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 79, 690.00, 1.00, NULL, 1, 690.00, 0.00, 690.00, false);

    -- Paciente 1537 | Fecha: 2016-08-30 | Total: 7180.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1537, 1, '2016-08-30', 7180.00, NULL, 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2440.00, 1.00, '38', 1, 2440.00, 0.00, 2440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '38', 1, 2890.00, 0.00, 2890.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 36, 1850.00, 1.00, '38', 1, 1850.00, 0.00, 1850.00, false);

    -- Paciente 282 | Fecha: 2016-09-26 | Total: 3238.50
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (282, 1, '2016-09-26', 3238.50, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '36', 1, 920.00, 15.00, 782.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '36', 1, 2890.00, 15.00, 2456.50, false);

    -- Paciente 893 | Fecha: 2017-08-24 | Total: 7000.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (893, 1, '2017-08-24', 7000.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '46-47', 2, 6360.00, 0.00, 6360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '16', 1, 640.00, 0.00, 640.00, false);

    -- Paciente 439 | Fecha: 2022-06-10 | Total: 30320.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (439, 1, '2022-06-10', 30320.00, '{"A":"ELEMENTO DENTAL 16 EN OBSERVACION, POSIBLE TRATAMIENTO DE CONDUCTOS","B":"ELEMENTO DENTAL 16 EN OBSERVACION, POSIBLE TRATAMIENTO DE CONDUCTOS"}', 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 760.00, 1.00, NULL, 1, 760.00, 0.00, 760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '13/23/33/34/35/43', 6, 3900.00, 0.00, 3900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '31/32/41/42/44/46', 6, 3900.00, 0.00, 3900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '14/15/24/25/36', 5, 5250.00, 0.00, 5250.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 381, 350.00, 1.00, '38', 1, 350.00, 0.00, 350.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '16/26/27', 3, 9540.00, 0.00, 9540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 78, 1280.00, 1.00, '13/12/11/21/22/23', 1, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 79, 760.00, 1.00, NULL, 1, 760.00, 0.00, 760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1050.00, 1.00, '36', 1, 1050.00, 0.00, 1050.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 381, 350.00, 1.00, '38', 1, 350.00, 0.00, 350.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '16', 1, 3180.00, 0.00, 3180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 439 | Fecha: 2025-09-30 | Total: 78440.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (439, 1, '2025-09-30', 78440.00, '{"A":"SE REALIZARA ELEVADO DE MORDIA PARA REPOSICION DE TEJIDO DENTAL PERDIDO POR OCLUSION TRAUMATICA.","B":"PREVIA PLANIFICACION DE IMPLANTES SE DEBE REALIZAR TOMOGRAFIA PARA VIAVILIDAD DE CIRUGIA"}', 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1550.00, 1.00, '13/11/21/23/33/43', 6, 9300.00, 0.00, 9300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1550.00, 1.00, '35/34/31/41/42/44', 6, 9300.00, 0.00, 9300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 4720.00, 1.00, '16/26/27', 3, 14160.00, 0.00, 14160.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 10390.00, 1.00, '45/46', 2, 20780.00, 0.00, 20780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 2970.00, 1.00, '45/46', 2, 5940.00, 0.00, 5940.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 311, 7560.00, 1.00, '45/46', 2, 15120.00, 0.00, 15120.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 310, 1200.00, 1.00, '45/46', 1, 1200.00, 0.00, 1200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 345, 2640.00, 1.00, NULL, 1, 2640.00, 0.00, 2640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2668 | Fecha: 2022-02-02 | Total: 32030.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2668, 1, '2022-02-02', 32030.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 37, 1280.00, 1.00, '26', 1, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 160, 3170.00, 1.00, '26', 1, 3170.00, 0.00, 3170.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1100.00, 1.00, '26', 1, 1100.00, 0.00, 1100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '26', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 37, 1280.00, 1.00, '26', 1, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 82, 3830.00, 1.00, '26', 1, 3830.00, 0.00, 3830.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '26', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1750.00, 1.00, '26', 1, 1750.00, 0.00, 1750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 5000.00, 1.00, '26', 1, 5000.00, 0.00, 5000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 221, 2500.00, 1.00, '26', 1, 2500.00, 0.00, 2500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 310, 650.00, 1.00, NULL, 1, 650.00, 0.00, 650.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 82, 3830.00, 1.00, '26', 1, 3830.00, 0.00, 3830.00, false);

    -- Paciente 2669 | Fecha: 2022-02-02 | Total: 3000.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2669, 1, '2022-02-02', 3000.00, '{"A":"SE VALORARA POST BLANQUEAMIENTO LA NECESIDAD DE REALIZAR CARILLAS DE PORCELANA POR COLOR SATURADO DE INCISIVO DENTAL CENTRAL IZQUIERDO"}', 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 138, 3000.00, 1.00, NULL, 1, 3000.00, 0.00, 3000.00, false);

    -- Paciente 497 | Fecha: 2020-10-08 | Total: 28860.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (497, 1, '2020-10-08', 28860.00, '{"A":"TRATAMIENTO ALTERNATIVA 2 PROTESIS FIJA"}', 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '15', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 2430.00, 1.00, '13', 1, 2430.00, 0.00, 2430.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1010.00, 1.00, '13', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '13', 1, 5690.00, 0.00, 5690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '14/15', 2, 11380.00, 0.00, 11380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '16', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1010.00, 1.00, '16', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '16', 1, 5690.00, 0.00, 5690.00, false);

    -- Paciente 497 | Fecha: 2020-11-03 | Total: 3926.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (497, 1, '2020-11-03', 3926.00, NULL, 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '15', 1, 640.00, 20.00, 512.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '13', 1, 1010.00, 30.00, 707.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 388, 2500.00, 1.00, NULL, 1, 2500.00, 20.00, 2000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '15', 1, 1010.00, 30.00, 707.00, false);

    -- Paciente 497 | Fecha: 2022-02-08 | Total: 37210.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (497, 1, '2022-02-08', 37210.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '14-15', 2, 14000.00, 0.00, 14000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 5000.00, 1.00, '14-15', 2, 10000.00, 0.00, 10000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '14-15', 2, 3500.00, 0.00, 3500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 169, 2310.00, 1.00, '46', 1, 2310.00, 0.00, 2310.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1750.00, 1.00, '46', 1, 1750.00, 0.00, 1750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 5000.00, 1.00, '46', 1, 5000.00, 0.00, 5000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 310, 650.00, 1.00, NULL, 1, 650.00, 0.00, 650.00, false);

    -- Paciente 497 | Fecha: 2023-11-01 | Total: 44420.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (497, 1, '2023-11-01', 44420.00, '{"A":"POSIBLE NECESIDAD  DE REALIZAR TRATAMIENTO DE ENDODONCIA EN SEGUNDO MOLAR DERECHO INFERIOR (47)Y SEGUNDO PREMOLAR DERECHO INFERIOR(45)"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 145, 920.00, 1.00, NULL, 1, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 3000.00, 1.00, '47-46-45', 3, 9000.00, 0.00, 9000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '44-34', 2, 6360.00, 0.00, 6360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 3000.00, 1.00, '36', 1, 3000.00, 0.00, 3000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '24-17', 2, 2100.00, 0.00, 2100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 3190.00, 1.00, '13-12-11-21-22-23', 6, 19140.00, 0.00, 19140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '33-32-31-41-42-43', 6, 3900.00, 0.00, 3900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 497 | Fecha: 2025-02-21 | Total: 14230.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (497, 1, '2025-02-21', 14230.00, '{"A":"SI EXISTE SENSIBILIDAD EN MOLAR Y PREMOLAR DERECHO INFERIOR SE DEBE REALIZAR TRATAMIENTO DE ENDODONCIA"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 240, 4170.00, 1.00, '47-46-45', 1, 4170.00, 0.00, 4170.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 710.00, 1.00, '44-43-33-34-35-36', 6, 4260.00, 0.00, 4260.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 710.00, 1.00, '13-12-11-21-22-23', 6, 4260.00, 0.00, 4260.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1540.00, 1.00, NULL, 1, 1540.00, 0.00, 1540.00, false);

    -- Paciente 626 | Fecha: 2022-02-11 | Total: 4780.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (626, 1, '2022-02-11', 4780.00, '{"A":"TRATAMIENTO DE BLANQUEMIENTO EN CONSULTORIO Y CON PLACAS PREDOSIFICADAS PARA QUE LO HAGA EN CASA\r\nSE LE REALIZA UN DESCUENTO ESPECIAL COBRANDOLE UNICAMENTE UNA ARCADA","B":"TRATAMIENTO QUE SE REALIZA UNICAMENTE EN CADA CON PLACAS PREDOSIFICADAS, TIENE UNA CITA DE EXPLICACION Y ENTREGA DEL TRATAMIENTO Y OTRA AL CONCLUIR PARA EL CONTROL DE MISMO\r\nSE LE REALIZA UN DESCUENTO ESPECIAL COBRANDOLE UNICAMENTE UNA ARCADA"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 138, 2500.00, 1.00, NULL, 2, 5000.00, 50.00, 2500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 123, 2280.00, 1.00, NULL, 1, 2280.00, 0.00, 2280.00, false);

    -- Paciente 2096 | Fecha: 2021-10-15 | Total: 9331.60
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2096, 1, '2021-10-15', 9331.60, '{"A":"SE VALORARA EL TIPO DE MATERIAL PORCELANA O ZIRCONIA AL RETIRAR LAS CARILLAS Y VALORAR EL COLOR DEL DIENTE REMANENTE Y DIENTES ADYACENTES"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 5690.00, 1.00, '12/22', 2, 11380.00, 18.00, 9331.60, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '12/22', 2, 1280.00, 100.00, 0.00, false);

    -- Paciente 381 | Fecha: 2022-03-23 | Total: 4030.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (381, 1, '2022-03-23', 4030.00, '{"A":"SE EVALUARA CAMBIO DE PLAN DE TRATAMIENTO DE ACUERDO A REVISION CLINICA, SI SE RELIZARA EL MUÑON-POSTE Y SI LA CORONA SERA DE CEROMERO O PORCELANA PURA, DE ACUERDO A REQUERIMIENTO."}', 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '46', 1, 1530.00, 0.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 2500.00, 1.00, '46', 1, 2500.00, 0.00, 2500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 1042 | Fecha: 2022-03-23 | Total: 1210.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1042, 1, '2022-03-23', 1210.00, NULL, 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1210.00, 1.00, NULL, 1, 1210.00, 0.00, 1210.00, false);

    -- Paciente 859 | Fecha: 2022-03-30 | Total: 1210.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (859, 1, '2022-03-30', 1210.00, NULL, 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1210.00, 1.00, NULL, 1, 1210.00, 0.00, 1210.00, false);

    -- Paciente 2977 | Fecha: 2025-03-10 | Total: 39770.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2977, 1, '2025-03-10', 39770.00, '{"A":"TRATAMIENTO AUMENTANDO DIMENSION VERTICAL, PARA MEJORAR EL TRAUMA OCLUSAL, PROTEGIENDO DENTINA, ELIMINANDO CARIES, DEVOLVIENDO FUNCION Y ALTURA INTERMAXILAR","B":"TRATAMIENTO SIN AUMENTAR LA DIMENSION VERTICAL, SE PROTEGE DENTINA EXPUESTA Y ELIMINACION DE CARIES, SE MANTIENE ALTURA INTERMAXILAR"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3500.00, 1.00, '47-46-37-36', 4, 14000.00, 0.00, 14000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 710.00, 1.00, '34-35-44-45', 4, 2840.00, 0.00, 2840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 283, 560.00, 1.00, '17-27-16-26', 4, 2240.00, 0.00, 2240.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 710.00, 1.00, '14-15-24-25', 4, 2840.00, 0.00, 2840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 710.00, 1.00, '13-12-11-21-22-23', 6, 4260.00, 0.00, 4260.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1150.00, 1.00, '37-36-47-46', 4, 4600.00, 0.00, 4600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 283, 560.00, 1.00, '17-16-27-26', 4, 2240.00, 0.00, 2240.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 710.00, 1.00, '21-11-24', 3, 2130.00, 0.00, 2130.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 132, 385.00, 1.00, '13-12-22-23', 4, 1540.00, 0.00, 1540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 345, 1540.00, 1.00, NULL, 1, 1540.00, 0.00, 1540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1540.00, 1.00, NULL, 1, 1540.00, 0.00, 1540.00, false);

    -- Paciente 2977 | Fecha: 2026-05-12 | Total: 4505.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2977, 1, '2026-05-12', 4505.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 138, 5300.00, 1.00, NULL, 1, 5300.00, 15.00, 4505.00, false);

    -- Paciente 722 | Fecha: 2025-09-09 | Total: 43432.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (722, 1, '2025-09-09', 43432.00, '{"A":"SE ENVIA INFORME E IMAGENES EXPLICANDO EL PLAN DE TRATAMIENTO"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 4720.00, 1.00, '38-36-47-46', 4, 18880.00, 25.00, 14160.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1550.00, 1.00, '34-35-44', 3, 4650.00, 20.00, 3720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 132, 600.00, 1.00, '32-31-41-42-33-43', 6, 3600.00, 20.00, 2880.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 960.00, 1.00, '13-12-11-22-23', 5, 4800.00, 20.00, 3840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1900.00, 1.00, '21', 1, 1900.00, 15.00, 1615.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 142, 1130.00, 1.00, '21', 1, 1130.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 2640.00, 1.00, NULL, 1, 2640.00, 60.00, 1056.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 275, 2700.00, 1.00, NULL, 1, 2700.00, 25.00, 2025.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1550.00, 1.00, '38-36-47-46', 4, 6200.00, 20.00, 4960.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1550.00, 1.00, '34-35-44', 3, 4650.00, 20.00, 3720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 121, 1900.00, 1.00, '21', 1, 1900.00, 20.00, 1520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 132, 600.00, 1.00, '33-32-31-41-42-43', 6, 3600.00, 20.00, 2880.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 142, 1130.00, 1.00, '21', 1, 1130.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 345, 2640.00, 1.00, NULL, 1, 2640.00, 60.00, 1056.00, false);

    -- Paciente 1241 | Fecha: 2025-09-09 | Total: 35620.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1241, 1, '2025-09-09', 35620.00, '{"A":"FASE A: CIRUGIA LEVANTAMIENTO DE SENO UNILATERAL\r\nFASE B: TRANSCURRIDOS 3 A 6 MESES DE LA CIRUGIA DE SENO PROCEDERAN CON CIRUGIA DE IMPLANTE.\r\nFASE C: TRANSCURRIDOS 3 A 4 MESES DE CIRUGIA DE IMPLANTE SE PROCEDE CON REHABILITACION MUÑON Y CORONA SOBRE IMPLANTE."}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 313, 7200.00, 1.00, '26', 1, 7200.00, 0.00, 7200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 93, 7500.00, 1.00, '26', 1, 7500.00, 0.00, 7500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 10390.00, 1.00, '26', 1, 10390.00, 0.00, 10390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2970.00, 1.00, '26', 1, 2970.00, 0.00, 2970.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 311, 7560.00, 1.00, '26', 1, 7560.00, 0.00, 7560.00, false);

    -- Paciente 1268 | Fecha: 2025-04-11 | Total: 28950.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1268, 1, '2025-04-11', 28950.00, '{"A":"FASE A QUIRURGICA\r\nFASE B TRANCURRIDOS DE 3 A 4 MESES DE LA CIRUGIA SE REALIZARA REHABILITACION, ES DECIR MUÑONES MAS CORONAS SOBRE IMPLANTE"}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 24, 440.00, 1.00, NULL, 1, 440.00, 0.00, 440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 310, 710.00, 1.00, NULL, 1, 710.00, 0.00, 710.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7700.00, 1.00, NULL, 2, 15400.00, 0.00, 15400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1800.00, 1.00, NULL, 2, 3600.00, 0.00, 3600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 218, 4400.00, 1.00, NULL, 2, 8800.00, 0.00, 8800.00, false);

    -- Paciente 2990 | Fecha: 2025-04-15 | Total: 5700.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2990, 1, '2025-04-15', 5700.00, NULL, 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 240, 5000.00, 1.00, '13-12-11', 1, 5000.00, 0.00, 5000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 700.00, 1.00, NULL, 1, 700.00, 0.00, 700.00, false);

    -- Paciente 113 | Fecha: 2025-04-23 | Total: 34530.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (113, 1, '2025-04-23', 34530.00, '{"A":"ES POSIBLE REALIZAR TRATAMIENTOS DE CONDUCTOS DE ACUERDO A SINTOMATOLOGIA DE CADA ELEMENTO DENTAL.\r\nSECUENCIA: ENCERADO -TALLADO - PRUEBA -CEMENTADO\r\nTIEMPO 2 SEMANAS"}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 145, 850.00, 1.00, NULL, 1, 850.00, 0.00, 850.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 700.00, 1.00, '34/33/32/31', 4, 2800.00, 0.00, 2800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 700.00, 1.00, '41/42/43/44', 4, 2800.00, 0.00, 2800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 3510.00, 1.00, '34/33/32/31', 4, 14040.00, 0.00, 14040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 3510.00, 1.00, '41/42/43/44', 4, 14040.00, 0.00, 14040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 1568 | Fecha: 2022-07-15 | Total: 21140.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1568, 1, '2022-07-15', 21140.00, '{"A":"POSTERIOR A FINALIZAR LA ORTODONCIA SE REALIZARA EL SELLADO DE DENTINA EXPUESTA EN LOS DIENTES INFERIOREES SECTOR ANTERIOR."}', 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1550.00, 1.00, '37-47', 2, 3100.00, 0.00, 3100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 4720.00, 1.00, '36-46', 2, 9440.00, 0.00, 9440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 132, 600.00, 1.00, '31-32-41-42', 4, 2400.00, 0.00, 2400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1550.00, 1.00, '37-36-47-46', 4, 6200.00, 0.00, 6200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 3000 | Fecha: 2025-09-01 | Total: 37610.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (3000, 1, '2025-09-01', 37610.00, '{"A":"SE REALIZA PLAN DE TRATAMIENTO POR OCLUSION TRAUMATICA."}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 4720.00, 1.00, '47-37-36', 3, 14160.00, 0.00, 14160.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1550.00, 1.00, '27-35-34-44-45', 5, 7750.00, 0.00, 7750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1900.00, 1.00, '46', 1, 1900.00, 0.00, 1900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 5640.00, 1.00, '25', 1, 5640.00, 0.00, 5640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 960.00, 1.00, '24-14', 2, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 3600.00, 1.00, '25', 1, 3600.00, 0.00, 3600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 2640.00, 1.00, NULL, 1, 2640.00, 0.00, 2640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2461 | Fecha: 2020-03-03 | Total: 1280.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2461, 1, '2020-03-03', 1280.00, '{"A":"DESPUES DE TRES MESES SE REALLIZARA LA REHABILITACION DEFINITIVA  DE CORONAS PORCELANA PURA C/U BS. 5690"}', 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '15/25', 2, 1280.00, 0.00, 1280.00, false);

    -- Paciente 2429 | Fecha: 2020-03-05 | Total: 27530.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2429, 1, '2020-03-05', 27530.00, NULL, 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 37, 1280.00, 1.00, '17', 1, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 3310.00, 1.00, '16', 1, 3310.00, 0.00, 3310.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '16/45', 2, 3060.00, 0.00, 3060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '16/45', 2, 11380.00, 0.00, 11380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 163, 2540.00, 1.00, '14', 1, 2540.00, 0.00, 2540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '14', 1, 3180.00, 0.00, 3180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '35', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '47', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 760.00, 1.00, NULL, 1, 760.00, 0.00, 760.00, false);

    -- Paciente 2074 | Fecha: 2020-03-06 | Total: 3960.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2074, 1, '2020-03-06', 3960.00, NULL, 13)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 111, 1980.00, 1.00, NULL, 2, 3960.00, 0.00, 3960.00, false);

    -- Paciente 2487 | Fecha: 2020-07-30 | Total: 8020.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2487, 1, '2020-07-30', 8020.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 3310.00, 1.00, '27', 1, 3310.00, 0.00, 3310.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2690.00, 1.00, '36', 1, 2690.00, 0.00, 2690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '36/27', 2, 2020.00, 0.00, 2020.00, false);

    -- Paciente 2481 | Fecha: 2020-08-13 | Total: 4690.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2481, 1, '2020-08-13', 4690.00, '{"A":"POSIBLE TRATAMIENTO DE ENDONCIA COSTO 2430.- BS EN UNIDAD DENTAL 35\r\nSE RECOMIENDA CIRUGIA Y REHABILITACION DE IMPLANTE EN SECTOR DERECHO SUPERIOR 15\r\nUNIDADES DENTALES 44 Y 45 SE VALORARAN CLINICAMENTE PARA PLANIFICAR TRATAMIENTO"}', 13)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 165, 760.00, 1.00, '35', 1, 760.00, 0.00, 760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '35', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '17', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 760.00, 1.00, NULL, 1, 760.00, 0.00, 760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 283, 510.00, 1.00, '47', 1, 510.00, 0.00, 510.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '16', 1, 640.00, 0.00, 640.00, false);

    -- Paciente 1228 | Fecha: 2020-08-14 | Total: 8380.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1228, 1, '2020-08-14', 8380.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '16', 1, 3180.00, 0.00, 3180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 121, 1240.00, 1.00, '16', 1, 1240.00, 0.00, 1240.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 111, 1980.00, 1.00, NULL, 2, 3960.00, 0.00, 3960.00, false);

    -- Paciente 1228 | Fecha: 2022-05-17 | Total: 2952.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1228, 1, '2022-05-17', 2952.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 123, 1800.00, 1.00, NULL, 2, 3600.00, 18.00, 2952.00, false);

    -- Paciente 2795 | Fecha: 2023-08-15 | Total: 33320.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2795, 1, '2023-08-15', 33320.00, NULL, 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '13-12-11-21-22', 5, 3250.00, 0.00, 3250.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '34-44', 2, 1300.00, 0.00, 1300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 131, 770.00, 1.00, NULL, 1, 770.00, 0.00, 770.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 177, 4000.00, 1.00, '13-12-11-21-22-23', 6, 24000.00, 0.00, 24000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 177, 4000.00, 1.00, '24', 1, 4000.00, 0.00, 4000.00, false);

    -- Paciente 109 | Fecha: 2022-10-10 | Total: 12562.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (109, 1, '2022-10-10', 12562.00, '{"A":"SECTOR ANTEROINFERIOR BORDES INCISALES NO SE REALIZARAN HASTA OBTENER ESTABILIDAD FUNCIONAL OCLUSAL.\r\nDRA NEISA CATACORA REALIZARA GUARDA OCLUSAL EN AMBOS MAXILARES, DE ACUERDO A REUNION."}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '16/15/12/23/37/47', 6, 3900.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 19, 1400.00, 1.00, '16/15/12/23/37/47', 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '13/11/21/22/36/35', 6, 6300.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 19, 1400.00, 1.00, '13/11/21/22/36/35', 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '46/34/44/45', 4, 4200.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 18, 1050.00, 1.00, '46/34/44/45', 1, 1050.00, 0.00, 1050.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '24', 1, 1530.00, 25.00, 1147.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '24', 1, 5690.00, 35.00, 3698.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '25', 1, 3180.00, 50.00, 1590.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '14', 1, 5690.00, 60.00, 2276.00, false);

    -- Paciente 22 | Fecha: 2022-11-03 | Total: 8600.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (22, 1, '2022-11-03', 8600.00, '{"A":"SE PUEDE REALIZAR INTERCAMBIO DE SERVICIO POR UN PORCENTAJE, DR Y PACIENTE HABLARAN DE CONVENIO"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 212, 8600.00, 1.00, NULL, 1, 8600.00, 0.00, 8600.00, false);

    -- Paciente 2832 | Fecha: 2024-03-27 | Total: 79521.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2832, 1, '2024-03-27', 79521.00, '{"A":"47. 1 RETIRO DE CORONA, MUÑON DE RESINA,CORONA PROVISIONAL, CORONA DEFINITIVA\r\n47. 2, INCRUSTACION U OBTURACION SOBRE CORONA PRESENTE"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 145, 847.00, 1.00, NULL, 1, 847.00, 0.00, 847.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3498.00, 1.00, '47-44-34-35-36', 5, 17490.00, 0.00, 17490.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 715.00, 1.00, '33-32-31-41-42-43', 6, 4290.00, 0.00, 4290.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3498.00, 1.00, '14-24-27', 3, 10494.00, 0.00, 10494.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 138, 2750.00, 1.00, NULL, 1, 2750.00, 0.00, 2750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1155.00, 1.00, '13-12-11-21-22-23', 6, 6930.00, 0.00, 6930.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 197, 3180.00, 1.00, '14-24', 2, 6360.00, 0.00, 6360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 117, 1210.00, 1.00, '27', 1, 1210.00, 0.00, 1210.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 177, 4000.00, 1.00, '13-12-11-21-22-23', 6, 24000.00, 0.00, 24000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 37, 1280.00, 1.00, '16', 1, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 32, 3870.00, 1.00, '25', 1, 3870.00, 0.00, 3870.00, false);

    -- Paciente 2729 | Fecha: 2024-04-10 | Total: 53176.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2729, 1, '2024-04-10', 53176.00, '{"A":"-SE EVALUARA ELEMENTOS DENTALES 35/37 PARA POSIBLES RETRATAMIENTOS DE CONDUCTOS Y ELEMENTO DENTAL 47 PARA TRATAMIENTO DE CONDUCTOS, UNA VEZ RETIRADAS LAS PROTESIS FIJAS PLURALES.\r\n-SE REHABILITARA IMPLANTES POSTERIOR A 4 MESES DE CIRUGIA."}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 24, 400.00, 1.00, '36/45/46', 2, 800.00, 20.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 326, 850.00, 1.00, '36/45/46', 1, 850.00, 20.00, 680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '36/45/46', 3, 21000.00, 20.00, 16800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1400.00, 1.00, '36/45/46', 3, 4200.00, 20.00, 3360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 311, 4000.00, 1.00, '36/45/46', 3, 12000.00, 20.00, 9600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '35/36/37', 2, 1280.00, 20.00, 1024.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '44/45/46/47', 4, 2560.00, 20.00, 2048.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 218, 4000.00, 1.00, '35/37/44/47', 4, 16000.00, 20.00, 12800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1100.00, 1.00, '35/37/44', 3, 3300.00, 20.00, 2640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '35/36/37', 3, 1920.00, 20.00, 1536.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '44/45/46/47', 4, 2560.00, 20.00, 2048.00, false);

    -- Paciente 2729 | Fecha: 2024-12-17 | Total: 48637.50
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2729, 1, '2024-12-17', 48637.50, '{"B":"SE VALORA AL TERMINAR EL TRATAMIENTO GUARDA OCLUSAL."}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 3190.00, 1.00, '13-12-11-21-22-23', 6, 19140.00, 15.00, 16269.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1210.00, 1.00, '14-24', 2, 1210.00, 15.00, 1028.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 272, 800.00, 1.00, '13-12-11-21-22-23', 1, 800.00, 15.00, 680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 177, 4500.00, 1.00, '13-12-11-21-22-23', 6, 27000.00, 0.00, 27000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1200.00, 1.00, '14-24', 2, 2400.00, 0.00, 2400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 272, 1260.00, 1.00, NULL, 1, 1260.00, 0.00, 1260.00, false);

    -- Paciente 2944 | Fecha: 2024-11-18 | Total: 8100.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2944, 1, '2024-11-18', 8100.00, '{"A":"SE RECOMIENDA  TRATAMIENTO DE ORTODONCIA PARA DAR FUNCION Y ALINEACION AL SECTOR ANTERIOR, ASI PODER REALIZAR UN TRATAMIENTO ESTETICO."}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1400.00, 1.00, NULL, 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 138, 3000.00, 1.00, NULL, 1, 3000.00, 0.00, 3000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 152, 1500.00, 1.00, NULL, 1, 1500.00, 0.00, 1500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 133, 2200.00, 1.00, NULL, 1, 2200.00, 0.00, 2200.00, false);

    -- Paciente 37 | Fecha: 2017-07-12 | Total: 4390.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (37, 1, '2017-07-12', 4390.00, NULL, 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 111, 1980.00, 1.00, NULL, 2, 3960.00, 0.00, 3960.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 113, 430.00, 1.00, '11', 1, 430.00, 0.00, 430.00, false);

    -- Paciente 37 | Fecha: 2023-10-20 | Total: 22346.50
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (37, 1, '2023-10-20', 22346.50, '{"A":"SE VALORARA LA NECESIDAD DE INCLUIR PREMOLARES POR ESTETICA\r\nEXISTE LA POSIBILIDAD DE REALIZAR TRATAMIENTO DE ENDODONCIA EN LATERALES SI HAY HIPERSENSIBILIDAD"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 131, 770.00, 1.00, NULL, 1, 770.00, 15.00, 654.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 3190.00, 1.00, '12-11-21-22-13-23', 6, 19140.00, 15.00, 16269.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 3190.00, 1.00, '14-24', 2, 6380.00, 15.00, 5423.00, false);

    -- Paciente 1527 | Fecha: 2018-07-24 | Total: 5530.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1527, 1, '2018-07-24', 5530.00, NULL, 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 165, 760.00, 1.00, '14/15', 2, 1520.00, 50.00, 760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '14/15', 2, 6360.00, 25.00, 4770.00, false);

    -- Paciente 1105 | Fecha: 2018-09-13 | Total: 7260.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1105, 1, '2018-09-13', 7260.00, NULL, 6)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '36', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '46/25', 2, 2020.00, 0.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '34/35/12/38/48', 5, 3200.00, 0.00, 3200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1240.00, 1.00, '17', 1, 1240.00, 0.00, 1240.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 9, 80.00, 1.00, '45/34', 2, 160.00, 0.00, 160.00, false);

    -- Paciente 2000 | Fecha: 2018-09-17 | Total: 48420.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2000, 1, '2018-09-17', 48420.00, NULL, 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 3190.00, 1.00, '13/12/11/21/22/23', 6, 19140.00, 0.00, 19140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '33/32/31/41/42/43', 6, 3840.00, 0.00, 3840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '17/24/34/35/37', 5, 15900.00, 0.00, 15900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '44/45/46', 3, 9540.00, 0.00, 9540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '36', 1, 1010.00, 100.00, 0.00, false);

    -- Paciente 1630 | Fecha: 2018-09-28 | Total: 11256.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1630, 1, '2018-09-28', 11256.00, NULL, 7)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '15', 1, 1530.00, 0.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3950.00, 1.00, '15', 1, 3950.00, 0.00, 3950.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1530.00, 1.00, '15', 1, 1530.00, 20.00, 1224.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5690.00, 1.00, '15', 1, 5690.00, 20.00, 4552.00, false);

    -- Paciente 2927 | Fecha: 2024-09-26 | Total: 10930.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2927, 1, '2024-09-26', 10930.00, '{"A":"POSIBLE MICRO CIRUGIA DE SEGUNDO MOLAR SUPERIOR IZQUIERDO.\r\nPOSIBLE TRATAMINETO DE CONDUCTOS DE PRIMER MOLAR SUPERIOR IZQUIERDO"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 3470.00, 1.00, '27', 1, 3470.00, 0.00, 3470.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1100.00, 1.00, '27', 1, 1100.00, 0.00, 1100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '27-26', 2, 6360.00, 0.00, 6360.00, false);

    -- Paciente 2930 | Fecha: 2024-09-27 | Total: 25690.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2930, 1, '2024-09-27', 25690.00, '{"A":"DE 2 A 4 MESES DESPUES CIRUGIA DE IMPLANTE.\r\nDE 2 A 3 MESES LUEGO DE CIRUGIA, REHABILITACION CORONA Y MUÑON SOBRE IMPLANTE.","B":"DE 2 A 3 MESES DESPUES DE CIRUGIA, REHABILITACION CORONA Y MUÑON SOBRE IMPLANTE"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '37', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 93, 5460.00, 1.00, '37', 1, 5460.00, 0.00, 5460.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '37', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 93, 5460.00, 1.00, '37', 1, 5460.00, 0.00, 5460.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '37', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1750.00, 1.00, '37', 1, 1750.00, 0.00, 1750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 311, 4000.00, 1.00, '37', 1, 4000.00, 0.00, 4000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2888 | Fecha: 2025-02-13 | Total: 58950.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2888, 1, '2025-02-13', 58950.00, '{"A":"PACIENTE PRESENTA , FRACTURAS, CARIES POR DESADAPTACION DE CARILLAS, OCLUSION TRAUMATICA CON DESGASTE DE ESMALTE EN DIENTES ANTERO INFERIORES\r\n\r\nEXISTE LA POSIBILIDA DE NECESITAR TRATAMIENTO DE ENDODONCIA EN SECTOR SUPERIOR  POR PREVIO DESGASTE DE TALLADO","B":"ES NECESARIO REALIZAR UN ELEVADO DE DIMENSION VERTICAL POR OCLUSION TRAUMATICA"}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 830.00, 1.00, NULL, 1, 830.00, 0.00, 830.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 700.00, 1.00, '13-12-11-21-22-23', 6, 4200.00, 0.00, 4200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 3510.00, 1.00, '13-12-11-21-22-23', 6, 21060.00, 0.00, 21060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1360.00, 1.00, '14-15-24-25', 4, 5440.00, 0.00, 5440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1540.00, 1.00, NULL, 1, 1540.00, 0.00, 1540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3500.00, 1.00, '37-36-47-46', 4, 14000.00, 0.00, 14000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1150.00, 1.00, '35-34-44-45', 4, 4600.00, 0.00, 4600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 710.00, 1.00, '33-32-31-41-42-43', 6, 4260.00, 0.00, 4260.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 147, 1320.00, 1.00, '27-26-25-17-16-15', 1, 1320.00, 0.00, 1320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 145, 850.00, 1.00, NULL, 1, 850.00, 0.00, 850.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 275, 850.00, 1.00, NULL, 1, 850.00, 0.00, 850.00, false);

    -- Paciente 139 | Fecha: 2025-02-20 | Total: 26392.20
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (139, 1, '2025-02-20', 26392.20, '{"A":"EXISTE LA POSIBILIDAD DE CAMBIO EN EL PRESUPUESTO DE ACUERDO AL DIAGNOSTICO CLINICO DURANTE LA SEDACION"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 347, 2110.00, 1.00, NULL, 1, 2110.00, 13.00, 1835.70, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 81, 1540.00, 1.00, NULL, 1, 1540.00, 15.00, 1309.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 2720.00, 1.00, '15', 1, 2720.00, 15.00, 2312.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1680.00, 1.00, '15', 1, 1680.00, 15.00, 1428.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 800.00, 1.00, '15', 1, 800.00, 15.00, 680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 3300.00, 1.00, '15', 1, 3300.00, 15.00, 2805.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3500.00, 1.00, '14', 1, 3500.00, 15.00, 2975.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 710.00, 1.00, '35-34-41-43-33', 5, 3550.00, 15.00, 3017.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 163, 2940.00, 1.00, '24', 1, 2940.00, 15.00, 2499.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1150.00, 1.00, '24', 1, 1150.00, 15.00, 977.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 82, 4210.00, 1.00, '47', 1, 4210.00, 15.00, 3578.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3500.00, 1.00, '24', 1, 3500.00, 15.00, 2975.00, false);

    -- Paciente 139 | Fecha: 2026-04-29 | Total: 1800.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (139, 1, '2026-04-29', 1800.00, '{"A":"SE RECOMIENDA TRATAMIENTO DE REHABILITACION ORAL, POR TRAUMA OCLUSAL\r\nFASE 1. ENCERADO Y MOCK UP\r\nFASE 2. RESTAURACIONES DIRECTAS E INDIRECTAS\r\nFASE 3. AJUSTE PULIDO Y CONTROL\r\nFASE 4. MANTENIMIENTO"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 275, 1800.00, 1.00, NULL, 1, 1800.00, 0.00, 1800.00, false);

    -- Paciente 1829 | Fecha: 2025-05-21 | Total: 2686.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1829, 1, '2025-05-21', 2686.00, NULL, 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 236, 2686.00, 1.00, NULL, 1, 2686.00, 0.00, 2686.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 3003 | Fecha: 2025-06-09 | Total: 2080.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (3003, 1, '2025-06-09', 2080.00, NULL, 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 2080.00, 1.00, NULL, 1, 2080.00, 0.00, 2080.00, false);

    -- Paciente 304 | Fecha: 2025-06-24 | Total: 31420.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (304, 1, '2025-06-24', 31420.00, '{"A":"SE RECOMIENDA MEJORAR HIGIENE BUCAL.\r\nMOVILIDAD GRADO I DE PUENTE ANTEROINFERIOR.\r\nSE CONSERVAN RAICES 43/44/45","B":"SE RECOMIENDA MEJORAR HIGIENE BUCAL.\r\nMOVILIDAD GRADO I DE PUENTE ANTEROINFERIOR."}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 132, 520.00, 1.00, '43/44/45', 3, 1560.00, 0.00, 1560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 236, 2690.00, 1.00, NULL, 1, 2690.00, 0.00, 2690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 38, 1300.00, 1.00, '43/44/45', 3, 3900.00, 0.00, 3900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 264, 12770.00, 1.00, NULL, 1, 12770.00, 0.00, 12770.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 101, 450.00, 1.00, NULL, 1, 450.00, 0.00, 450.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 101, 450.00, 1.00, NULL, 1, 450.00, 0.00, 450.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 960.00, 1.00, '33/32/31/41/42', 5, 4800.00, 0.00, 4800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 960.00, 1.00, '33/32/31/41/42', 5, 4800.00, 0.00, 4800.00, false);

    -- Paciente 3048 | Fecha: 2026-01-27 | Total: 47900.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (3048, 1, '2026-01-27', 47900.00, '{"A":"PLAN DE TRATAMIENTO REHABILITACION ORAL ADHESIVA CON AUMENTO DE DIMENSION VERTICAL","B":"PLAN DE TRATAMIENTO, SELLADO DENTINARIO, PARA EVITAR DESGASTE DE TEJIDO DENTAL, SE RECOMIENDA CONTROL CADA 6 MESES, SE MANTIENE OCLUSION ACTUAL","C":"SE RECOMIENDA EXTRACCION POR FALTA DE FUNCION, ACUMULO DE BACTERIAS Y BOLSA PERIODONTAL\r\n\r\nSE REQUIERE UN ESTUDIO DE TOMOGRAFIA PREVIO"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 4000.00, 1.00, '37-47-36-46', 4, 16000.00, 0.00, 16000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1200.00, 1.00, '34-44-45-35', 4, 4800.00, 0.00, 4800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 800.00, 1.00, '33-32-31-41-42-43', 6, 4800.00, 0.00, 4800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 800.00, 1.00, '13-12-11-21-22-23', 6, 4800.00, 0.00, 4800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 2200.00, 1.00, NULL, 1, 2200.00, 0.00, 2200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 132, 500.00, 1.00, '37-36-47-46-16', 5, 2500.00, 0.00, 2500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1200.00, 1.00, '26', 1, 1200.00, 0.00, 1200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 36, 4000.00, 1.00, '48', 1, 4000.00, 0.00, 4000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 132, 500.00, 1.00, '32-31-41-42-21-11', 6, 3000.00, 0.00, 3000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1200.00, 1.00, '26-16', 2, 2400.00, 0.00, 2400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 345, 2200.00, 1.00, NULL, 1, 2200.00, 0.00, 2200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2865 | Fecha: 2026-02-04 | Total: 2500.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2865, 1, '2026-02-04', 2500.00, NULL, 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 154, 2500.00, 1.00, NULL, 1, 2500.00, 0.00, 2500.00, false);

    -- Paciente 3026 | Fecha: 2026-02-12 | Total: 61664.50
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (3026, 1, '2026-02-12', 61664.50, '{"A":"DE ACUERDO A SECUENCIA DE IMPLANTE SE INICIA CON MAXILAR SUPERIOR IZQUIERDO.\r\nFASE 1\r\n1.- CIRUGIA DE IMPLANTE\r\n2.- REHABILITACION 2-4 MESES POSTERIOR A IMPLANTE","B":"FASE 2\r\n1.- CIRUGIA IMPLANTE\r\n2.- REHABILITACION 2-4 MESES POSTERIOR A IMPLANTE\r\n34 PRIMER PREMOLAR INFERIOR IZQUIERDO , ESTRUCTURA DENTAL DEBILITADA, POSIBLE IMPLANTE A CORTO PLAZO","C":"FASE 3\r\nMAXILAR SUPERIOR DERECHO\r\nSE EVALUARA FENOTIPO GINGIVAL Y NIVEL DE MARGEN PARA COLOCACION DE IMPLANTE"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 8700.00, 1.00, '25', 1, 8700.00, 15.00, 7395.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2970.00, 1.00, '25', 1, 2970.00, 15.00, 2524.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 311, 6300.00, 1.00, '25', 1, 6300.00, 15.00, 5355.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 8700.00, 1.00, '36', 1, 8700.00, 0.00, 8700.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 2970.00, 1.00, '36', 1, 2970.00, 0.00, 2970.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 311, 6300.00, 1.00, '36', 1, 6300.00, 0.00, 6300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 310, 1000.00, 1.00, '36', 1, 1000.00, 0.00, 1000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 34, 1600.00, 1.00, '16', 1, 1600.00, 0.00, 1600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 292, 8700.00, 1.00, '16', 1, 8700.00, 0.00, 8700.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 293, 2970.00, 1.00, '16', 1, 2970.00, 0.00, 2970.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 311, 6300.00, 1.00, '16', 1, 6300.00, 0.00, 6300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 82, 6000.00, 1.00, '16', 1, 6000.00, 0.00, 6000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 310, 1000.00, 1.00, '16', 1, 1000.00, 0.00, 1000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 1000.00, 1.00, '25', 1, 1000.00, 15.00, 850.00, false);

    -- Paciente 3033 | Fecha: 2026-01-22 | Total: 159160.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (3033, 1, '2026-01-22', 159160.00, '{"A":"POSIBLE CIRUGIA APICAL PZA. 33\r\nPOSIBLE REHABILITACION DE 33 CON POSTE MUÑON Y CORONA. POR REEMPLAZO DE CORONA O FRACTURA DURANTE ENDODONCIA.\r\n32 A 43 ALTERNATIVA OBTURACION COMPUESTA","B":"SI REQUIERE 24/25 RELLENO OSEO + MEMBRANA ESTA SUJETO EN ACTO QUIRURGICO SECTOR SUPERIOR IZQUIERDO.\r\nPOSIBLE RETRATAMIENTO DE CONSUCTOS 26","C":"VALORACION DE 17.\r\nPOSTERIOR A CIRUGIA DE IMPLANTE DEBE REHABILITARSE A LOS 4 O 6 MESES, POR PROCESO DE OSEOINTEGRACION."}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 81, 2080.00, 1.00, NULL, 1, 2080.00, 0.00, 2080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 145, 1200.00, 1.00, NULL, 1, 1200.00, 0.00, 1200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 275, 1200.00, 1.00, NULL, 1, 1200.00, 0.00, 1200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 4500.00, 1.00, '33', 1, 4500.00, 0.00, 4500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1200.00, 1.00, '34/35/36/45/46', 5, 6000.00, 0.00, 6000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 330, 900.00, 1.00, '37', 1, 900.00, 0.00, 900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 4700.00, 1.00, '44', 1, 4700.00, 0.00, 4700.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 114, 3500.00, 1.00, '33/32/31/41/42/43', 6, 21000.00, 0.00, 21000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1850.00, 1.00, '13/12/11/21/22/23', 6, 11100.00, 0.00, 11100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 249, 1000.00, 1.00, '24/25', 2, 2000.00, 0.00, 2000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 8700.00, 1.00, '24/25', 2, 17400.00, 0.00, 17400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 2970.00, 1.00, '24/25', 2, 5940.00, 0.00, 5940.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 311, 6300.00, 1.00, '24/25', 2, 12600.00, 0.00, 12600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 239, 4000.00, 1.00, '24/25', 1, 4000.00, 0.00, 4000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 313, 6000.00, 1.00, '24/25', 1, 6000.00, 0.00, 6000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 93, 7000.00, 1.00, '14', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 62, 2000.00, 1.00, '14', 1, 2000.00, 0.00, 2000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 249, 1000.00, 1.00, '14/15', 1, 1000.00, 0.00, 1000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 34, 1600.00, 1.00, '14', 1, 1600.00, 0.00, 1600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 292, 8700.00, 1.00, '14/15', 2, 17400.00, 0.00, 17400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 293, 2970.00, 1.00, '14/15', 2, 5940.00, 0.00, 5940.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 311, 6300.00, 1.00, '14/15', 2, 12600.00, 0.00, 12600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 239, 4000.00, 1.00, '14/15', 1, 4000.00, 0.00, 4000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 93, 7000.00, 1.00, '24/25', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 3033 | Fecha: 2026-01-22 | Total: 39500.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (3033, 1, '2026-01-22', 39500.00, '{"A":"SE SUGIERE REEMPLAZO DE CORONA EN 22/23 POR ACOPLE ESTETICO Y FUNCIONAL CON IMPLANTES 24/25"}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 2200.00, 1.00, NULL, 1, 2200.00, 0.00, 2200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4500.00, 1.00, '13/12/11/21/22', 5, 22500.00, 0.00, 22500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 1000.00, 1.00, '22/23', 2, 2000.00, 0.00, 2000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1900.00, 1.00, '22/23', 2, 3800.00, 0.00, 3800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 218, 4500.00, 1.00, '22/23', 2, 9000.00, 0.00, 9000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 38 | Fecha: 2023-09-27 | Total: 19352.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (38, 1, '2023-09-27', 19352.00, '{"A":"PACIENTE DEBERA INDICAR MATERIAL DE CORONAS"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '17', 1, 3180.00, 20.00, 2544.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '26/27', 2, 6360.00, 20.00, 5088.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '37', 1, 650.00, 20.00, 520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 760.00, 1.00, NULL, 1, 760.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 218, 4000.00, 1.00, '46/47', 2, 8000.00, 20.00, 6400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 3000.00, 1.00, '46/46', 2, 6000.00, 20.00, 4800.00, false);

    -- Paciente 2827 | Fecha: 2023-10-05 | Total: 85394.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2827, 1, '2023-10-05', 85394.00, '{"A":"46 RTC POSTE-CORONA PP"}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 9, 120.00, 1.00, '17/16/15/14', 4, 480.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 3470.00, 1.00, '16', 1, 3470.00, 70.00, 1041.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2870.00, 1.00, '17', 1, 2870.00, 70.00, 861.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 3000.00, 1.00, '24-25', 2, 6000.00, 50.00, 3000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '15', 1, 3180.00, 60.00, 1272.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 237, 2670.00, 1.00, NULL, 1, 2670.00, 0.00, 2670.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '17', 1, 1530.00, 0.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 3000.00, 1.00, '17-16-14-26-27', 5, 15000.00, 0.00, 15000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1100.00, 1.00, '16-14-26-27', 4, 4400.00, 0.00, 4400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 3190.00, 1.00, '13-12-11-21-22-23', 6, 19140.00, 0.00, 19140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '11-21-26-27', 4, 2560.00, 0.00, 2560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '26-27', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1400.00, 1.00, NULL, 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '36-37-47', 3, 9540.00, 0.00, 9540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '35-34-33-32-31-41', 6, 3840.00, 0.00, 3840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '42-46', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '35-34-33-32-31-41', 6, 3840.00, 0.00, 3840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '42-46', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 218, 4000.00, 1.00, '43', 1, 4000.00, 0.00, 4000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '44-45', 2, 6360.00, 0.00, 6360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1100.00, 1.00, '46', 1, 1100.00, 0.00, 1100.00, false);

    -- Paciente 2827 | Fecha: 2023-11-14 | Total: 47990.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2827, 1, '2023-11-14', 47990.00, '{"A":"LA PRESENTE PROPUESTA ES UNICAMENTE MAXILAR SUPERIOR\r\nMAXILAR INFERIOR SE COMPLEMENTARA CON RESINA DE MANERA TEMPORAL, HASTA INICIAR REHABILITACION EN MAXILAR INFERIOR"}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2870.00, 1.00, '17', 1, 2870.00, 0.00, 2870.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1100.00, 1.00, '17', 1, 1100.00, 0.00, 1100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 3000.00, 1.00, '17/16/14/26/27', 5, 15000.00, 0.00, 15000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '15/13/23/24/25', 5, 15900.00, 0.00, 15900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '26/27', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4000.00, 1.00, '12/22', 2, 8000.00, 0.00, 8000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '11/21', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '11/21', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '26/27', 2, 1280.00, 0.00, 1280.00, false);

    -- Paciente 2827 | Fecha: 2025-01-02 | Total: 4800.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2827, 1, '2025-01-02', 4800.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2870.00, 1.00, '21', 1, 2870.00, 0.00, 2870.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '21', 1, 1530.00, 0.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 259, 400.00, 1.00, '21', 1, 400.00, 0.00, 400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, '21', 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2184 | Fecha: 2023-10-05 | Total: 3060.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2184, 1, '2023-10-05', 3060.00, '{"A":"PLAN DE PAGOS\r\nOPCION 1: 2 CUOTAS MENSUALES CON EL 15 % \r\n\r\nOPCION 2: UNA CUOTA CON EL 20 % DE DESCUENTO ( BS 2888)"}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 123, 1800.00, 1.00, NULL, 2, 3600.00, 15.00, 3060.00, false);

    -- Paciente 570 | Fecha: 2023-10-09 | Total: 6400.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (570, 1, '2023-10-09', 6400.00, NULL, 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 138, 2500.00, 1.00, NULL, 2, 5000.00, 0.00, 5000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1400.00, 1.00, NULL, 1, 1400.00, 0.00, 1400.00, false);

    -- Paciente 474 | Fecha: 2023-10-10 | Total: 1400.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (474, 1, '2023-10-10', 1400.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1400.00, 1.00, NULL, 1, 1400.00, 0.00, 1400.00, false);

    -- Paciente 1949 | Fecha: 2023-10-10 | Total: 7110.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1949, 1, '2023-10-10', 7110.00, '{"A":"SEDACION BS. 1680"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 35, 2540.00, 1.00, '18-28', 2, 5080.00, 0.00, 5080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 36, 2030.00, 1.00, '38', 1, 2030.00, 0.00, 2030.00, false);

    -- Paciente 1955 | Fecha: 2023-10-11 | Total: 26048.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1955, 1, '2023-10-11', 26048.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '16-15-27-26-25', 5, 15900.00, 45.00, 8745.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '37-35-34', 3, 9540.00, 45.00, 5247.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '44-45-46-47', 4, 12720.00, 45.00, 6996.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '33-32-31-41-42-43', 6, 3900.00, 45.00, 2145.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '13-12-11-21-22-23', 6, 3900.00, 45.00, 2145.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1400.00, 1.00, NULL, 1, 1400.00, 45.00, 770.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2811 | Fecha: 2023-10-20 | Total: 9020.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2811, 1, '2023-10-20', 9020.00, '{"B":"DESPUES DE TRES MESES SE REALIZARA EL CAMBIO A LA CORONA DEFINITIVA DE CEROMERO"}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '45', 1, 3180.00, 0.00, 3180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1100.00, 1.00, '45', 1, 1100.00, 0.00, 1100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 224, 1100.00, 1.00, '45', 1, 1100.00, 0.00, 1100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 640.00, 1.00, '45', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 241, 3000.00, 1.00, '45', 1, 3000.00, 0.00, 3000.00, false);

    -- Paciente 1910 | Fecha: 2023-10-20 | Total: 28200.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1910, 1, '2023-10-20', 28200.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4000.00, 1.00, '13-12-11-21-22-23', 6, 24000.00, 0.00, 24000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 141, 700.00, 1.00, '13-12-11-21-22-23', 6, 4200.00, 0.00, 4200.00, false);

    -- Paciente 2806 | Fecha: 2023-08-03 | Total: 12010.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2806, 1, '2023-08-03', 12010.00, NULL, 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '11', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 321, 700.00, 1.00, '11', 1, 700.00, 0.00, 700.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 222, 1500.00, 1.00, '11', 1, 1500.00, 0.00, 1500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '12', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '12', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '12', 1, 1530.00, 0.00, 1530.00, false);

    -- Paciente 2225 | Fecha: 2018-11-16 | Total: 4480.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2225, 1, '2018-11-16', 4480.00, NULL, 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '33/43/23/13', 4, 2560.00, 0.00, 2560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 640.00, 1.00, '44/14/15', 3, 1920.00, 0.00, 1920.00, false);

    -- Paciente 2508 | Fecha: 2020-12-01 | Total: 61000.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2508, 1, '2020-12-01', 61000.00, '{"A":"PRIMER PAGO  CIRUGIA DE IMPLANTE.\r\n4-6 MESES DESPUES , SEGUNDA FASE RAHABILITACION MUÑON Y CORONA"}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '46-47-', 2, 14000.00, 0.00, 14000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '46-47', 2, 3500.00, 0.00, 3500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4150.00, 1.00, '46-47-', 2, 8300.00, 0.00, 8300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '46', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1750.00, 1.00, '46', 1, 1750.00, 0.00, 1750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 4150.00, 1.00, '46', 1, 4150.00, 0.00, 4150.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 292, 7000.00, 1.00, '46-48', 2, 14000.00, 0.00, 14000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 294, 4150.00, 1.00, '46-48', 2, 8300.00, 0.00, 8300.00, false);

    -- Paciente 129 | Fecha: 2018-03-28 | Total: 22667.50
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (129, 1, '2018-03-28', 22667.50, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '15-26-27', 3, 17070.00, 25.00, 12802.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '45-36', 2, 11380.00, 25.00, 8535.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 203, 1900.00, 1.00, NULL, 1, 1900.00, 30.00, 1330.00, false);

    -- Paciente 733 | Fecha: 2016-06-08 | Total: 53966.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (733, 1, '2016-06-08', 53966.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '16/15/14/26/36/34', 6, 5520.00, 0.00, 5520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '32/31/41/42/44/45', 6, 5520.00, 0.00, 5520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 920.00, 1.00, '46', 1, 920.00, 0.00, 920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 2890.00, 1.00, '35', 1, 2890.00, 0.00, 2890.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 245, 5170.00, 1.00, '13/12/11/21/22/23', 6, 31020.00, 0.00, 31020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 920.00, 1.00, '12/11/21/23/37', 5, 4600.00, 20.00, 3680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 920.00, 1.00, '33/32/31/41/42/43', 6, 5520.00, 20.00, 4416.00, false);

    -- Paciente 2682 | Fecha: 2022-06-01 | Total: 53590.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2682, 1, '2022-06-01', 53590.00, '{"A":"POSIBLE TRATAMIENTO DE CONDUCTOS EN ELEMENTO DENTAL 45 (2470 BS)"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '45', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '45-46-47', 3, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1100.00, 1.00, '45', 1, 1100.00, 0.00, 1100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 249, 640.00, 1.00, '45', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 162, 2470.00, 1.00, '45', 1, 2470.00, 0.00, 2470.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 224, 1100.00, 1.00, '45', 1, 1100.00, 0.00, 1100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 241, 2500.00, 1.00, '45-46-47', 3, 7500.00, 0.00, 7500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 249, 640.00, 1.00, '45', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 162, 2470.00, 1.00, '45', 1, 2470.00, 0.00, 2470.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 224, 1100.00, 1.00, '45', 1, 1100.00, 0.00, 1100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 380, 5690.00, 1.00, '45-46-47', 3, 17070.00, 0.00, 17070.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 292, 7000.00, 1.00, '46', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 380, 5690.00, 1.00, '46', 1, 5690.00, 0.00, 5690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 293, 1750.00, 1.00, '46', 1, 1750.00, 0.00, 1750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 241, 2500.00, 1.00, '47', 1, 2500.00, 0.00, 2500.00, false);

    -- Paciente 2946 | Fecha: 2024-11-12 | Total: 13860.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2946, 1, '2024-11-12', 13860.00, '{"A":"INDICACION DE EXTRACCION POR DESTRUCCION  DE TEJIDO DENTAL, LESION APICAL BACTERIANA"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '18-38-37', 3, 3030.00, 0.00, 3030.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 37, 1280.00, 1.00, '17', 1, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 60, 1520.00, 1.00, '37', 1, 1520.00, 0.00, 1520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 173, 3170.00, 1.00, '47', 1, 3170.00, 0.00, 3170.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 3000.00, 1.00, '47', 1, 3000.00, 0.00, 3000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 760.00, 1.00, NULL, 1, 760.00, 0.00, 760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1100.00, 1.00, '47', 1, 1100.00, 0.00, 1100.00, false);

    -- Paciente 2946 | Fecha: 2025-09-29 | Total: 42220.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2946, 1, '2025-09-29', 42220.00, '{"A":"SE SOLICITARA OTRA TOMOGRAFIA PARA VALORAR LA NECESIDAD DE INJERTO OSEO.\r\nPRIMERA FASE IMPLANTE, SEGUNDA FASE (2 -3 MESES DESPUES ) REHABILITACION (MUNON + CORONA)\r\nSE RECOMIENDA RALIZAR TRATAMIENTO EN SEGUNDO MOLAR INFERIOR DERECHO OPCION A. ENDODONCIA +REHABIULITACION OPCION B. EXTRACCION + IMPLANTE"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 10390.00, 1.00, '37', 1, 10390.00, 0.00, 10390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2970.00, 1.00, '37', 1, 2970.00, 0.00, 2970.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 311, 7560.00, 1.00, '37', 1, 7560.00, 0.00, 7560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 93, 7500.00, 1.00, NULL, 1, 7500.00, 0.00, 7500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 161, 5040.00, 1.00, '47', 1, 5040.00, 0.00, 5040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 224, 2040.00, 1.00, '47', 1, 2040.00, 0.00, 2040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 241, 5640.00, 1.00, '47', 1, 5640.00, 0.00, 5640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 1080.00, 1.00, '47', 1, 1080.00, 0.00, 1080.00, false);

    -- Paciente 2847 | Fecha: 2024-01-04 | Total: 90630.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2847, 1, '2024-01-04', 90630.00, '{"A":"PLAN DE TRATAMIENTO FASE CARIOLOGIA, PERIODONCIA, PARA DEVOVER SALUD","B":"FASE DE REHABILITACION, PACIENTE REQUIERE ELEVADO DE DIMENSION VERTICAL POR TRAUMA DE MORDIDA, DESGASTE SEVERO EN GUIA ANTERIOR","C":"FASE QUIRURGICA\r\n1 FASE CIRUGIA DE IMPLANTE\r\n3 A 6 MESES SE REALIZA LA REHABILITACION"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 760.00, 1.00, NULL, 1, 760.00, 0.00, 760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 118, 1100.00, 1.00, '17-26-27-37-36-47', 6, 6600.00, 0.00, 6600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '15-14-35-45-18-48', 6, 6300.00, 0.00, 6300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1400.00, 1.00, NULL, 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '17-26-27-36-46-47', 6, 19080.00, 0.00, 19080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '15-14-24-25-34-35', 6, 19080.00, 0.00, 19080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '44-45', 2, 6360.00, 0.00, 6360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1050.00, 1.00, '13-12-11-21-22-23', 6, 6300.00, 0.00, 6300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1050.00, 1.00, '33-32-31-41-42-43', 6, 6300.00, 0.00, 6300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 310, 650.00, 1.00, '16', 1, 650.00, 0.00, 650.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 292, 7000.00, 1.00, '16', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 293, 1400.00, 1.00, '16', 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 311, 4000.00, 1.00, '16', 1, 4000.00, 0.00, 4000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1400.00, 1.00, '16', 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 311, 4000.00, 1.00, '16', 1, 4000.00, 0.00, 4000.00, false);

    -- Paciente 442 | Fecha: 2024-01-30 | Total: 18870.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (442, 1, '2024-01-30', 18870.00, '{"A":"SE REALIZA TRATAMIENTO PARA AUMENTO DE DIMENSION VERTICAL POR OCLUSION TRAUMATICA"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 145, 770.00, 1.00, NULL, 1, 770.00, 15.00, 654.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '16-15-14-24-26-27', 6, 19080.00, 15.00, 16218.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '25', 1, 1050.00, 15.00, 892.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '13-23', 2, 1300.00, 15.00, 1105.00, false);

    -- Paciente 2859 | Fecha: 2024-02-22 | Total: 42240.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2859, 1, '2024-02-22', 42240.00, '{"A":"SE RECOMIENDA AUMENTAR ALTURA POSTERIOR POR TRAUMA DE OCLUSION","B":"POSIBILIDAD DE REALIZAR TRATAMIENTO DE CONDUCTOS SI PACIENTE REFIERE HIPERSENSIBILIDAD"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '11-21', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '11-21', 2, 3060.00, 0.00, 3060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '11-21-22', 3, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 218, 4000.00, 1.00, '11-21-22', 3, 12000.00, 0.00, 12000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1400.00, 1.00, NULL, 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 145, 770.00, 1.00, '33-32-31-41-42-43', 1, 770.00, 0.00, 770.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3190.00, 1.00, '33-32-31-41-42-43', 6, 19140.00, 0.00, 19140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 171, 2670.00, 1.00, '11-21', 1, 2670.00, 0.00, 2670.00, false);

    -- Paciente 58 | Fecha: 2017-11-21 | Total: 9640.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (58, 1, '2017-11-21', 9640.00, NULL, 4)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 185, 3950.00, 1.00, '47', 1, 3950.00, 0.00, 3950.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '47', 1, 5690.00, 0.00, 5690.00, false);

    -- Paciente 676 | Fecha: 2017-11-23 | Total: 32700.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (676, 1, '2017-11-23', 32700.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 760.00, 1.00, NULL, 1, 760.00, 0.00, 760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '46/17', 2, 6360.00, 0.00, 6360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '37/36/16', 3, 4590.00, 0.00, 4590.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '16/36/37', 3, 17070.00, 0.00, 17070.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1010.00, 1.00, '47/15', 2, 2020.00, 0.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 203, 1900.00, 1.00, NULL, 1, 1900.00, 0.00, 1900.00, false);

    -- Paciente 2551 | Fecha: 2021-02-02 | Total: 92890.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2551, 1, '2021-02-02', 92890.00, '{"A":"EXISTE POSIBILIDAD DE REALIZAR MICROCIRUGIA APICAL EN PIEZA 45. BS.3870.-\r\nGUIA QUIRURGICA PARA IMPLANTE SE EVALUARA","B":"FASE A: CIRUGIA DE IMPLANTE\r\nFASE B: TRANSCURRIDOS 3 A4 MESES DE LA CIRUGIA SE REALIZARA LA REHABILITACION , ES DECIR MUÑON Y CORONA SOBRE IMPLANTE","C":"POSIBLE MICROCIRUGIA PZA.45 BS.3870.-"}', 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '46', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '46', 1, 1750.00, 0.00, 1750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 5000.00, 1.00, '46', 1, 5000.00, 0.00, 5000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2870.00, 1.00, '45', 1, 2870.00, 0.00, 2870.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1100.00, 1.00, '45/47', 2, 2200.00, 0.00, 2200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '45/47', 2, 11380.00, 0.00, 11380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '45/47', 2, 2020.00, 0.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '45/46/47', 3, 21000.00, 0.00, 21000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1750.00, 1.00, '45/46/47', 3, 5250.00, 0.00, 5250.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 5000.00, 1.00, '45/46/47', 3, 15000.00, 0.00, 15000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 221, 2500.00, 1.00, NULL, 1, 2500.00, 0.00, 2500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 159, 2870.00, 1.00, '45', 1, 2870.00, 0.00, 2870.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 224, 1100.00, 1.00, '45/47', 2, 2200.00, 0.00, 2200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 185, 3950.00, 1.00, '45/46/47', 3, 11850.00, 0.00, 11850.00, false);

    -- Paciente 1138 | Fecha: 2023-05-22 | Total: 2500.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1138, 1, '2023-05-22', 2500.00, '{"A":"SE RECOMIENDA REALIZAR BLANQUEAMIENTO DENTAL EN SUPERIOR E INFERIOR PARA ARMONIZAR ESTETICA\r\n\r\nSE RECOMIENDA REALIZAR CONTROL Y LIMPIEZA DENTAL CADA 4 MESES POR INFLAMACION EN ENCIAS"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 138, 2500.00, 1.00, NULL, 1, 2500.00, 0.00, 2500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 1765 | Fecha: 2023-06-02 | Total: 1800.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1765, 1, '2023-06-02', 1800.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 141, 450.00, 1.00, '13-11-21-33', 4, 1800.00, 0.00, 1800.00, false);

    -- Paciente 2068 | Fecha: 2023-06-05 | Total: 26770.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2068, 1, '2023-06-05', 26770.00, NULL, 20)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4000.00, 1.00, '13/12/11/21/22/23', 6, 24000.00, 0.00, 24000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 111, 2000.00, 1.00, NULL, 1, 2000.00, 0.00, 2000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 131, 770.00, 1.00, '13/12/11/21/22/23', 1, 770.00, 0.00, 770.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2373 | Fecha: 2023-06-19 | Total: 22180.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2373, 1, '2023-06-19', 22180.00, NULL, 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 36, 2030.00, 1.00, '38/48', 2, 4060.00, 0.00, 4060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 35, 1400.00, 1.00, '18/28', 2, 2800.00, 0.00, 2800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 347, 1680.00, 1.00, NULL, 1, 1680.00, 0.00, 1680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 36, 3440.00, 1.00, '38/48', 2, 6880.00, 0.00, 6880.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 35, 2540.00, 1.00, '18/28', 2, 5080.00, 0.00, 5080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 347, 1680.00, 1.00, NULL, 1, 1680.00, 0.00, 1680.00, false);

    -- Paciente 1803 | Fecha: 2024-07-30 | Total: 35110.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1803, 1, '2024-07-30', 35110.00, '{"A":"POSIBLE TRATAMIENTO DE ENDODONCIA EN CANINO INFERIOR IZQUIERDO","B":"EN LA REHABILITACION CON ROCONAS INDIVIDUALES A PRIMER MOLAR\r\n\r\nSERGUNDA OPCION 2 IMPLANTES Y UN PUENTE SOBRE IMPLANTES 35-36-37"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '33', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1100.00, 1.00, '33', 1, 1100.00, 0.00, 1100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 3000.00, 1.00, '33', 1, 3000.00, 0.00, 3000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '37-36', 2, 2020.00, 0.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 24, 400.00, 1.00, NULL, 1, 400.00, 0.00, 400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 310, 650.00, 1.00, '35-36', 1, 650.00, 0.00, 650.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '35-36', 2, 14000.00, 0.00, 14000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1400.00, 1.00, '35-36', 2, 2800.00, 0.00, 2800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 311, 4000.00, 1.00, '35-36', 2, 8000.00, 0.00, 8000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 267, 2500.00, 1.00, '35-36', 1, 2500.00, 0.00, 2500.00, false);

    -- Paciente 1880 | Fecha: 2024-07-31 | Total: 28362.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1880, 1, '2024-07-31', 28362.00, '{"A":"LOS PREMOLARES SE REALIZARAN DE FORMA DIRECTA,  EN 6 MESES SE VALORA CAMBIO A INCRUSTACIONES"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '37-36-46-47', 4, 12720.00, 40.00, 7632.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1240.00, 1.00, '35-34-44-45-25-24', 6, 7440.00, 60.00, 2976.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '33-32-34-41-42-43', 6, 6300.00, 70.00, 1890.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 131, 920.00, 1.00, NULL, 1, 920.00, 40.00, 552.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 3190.00, 1.00, '13-12-11-21-22-23', 6, 19140.00, 40.00, 11484.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 3190.00, 1.00, '14-24', 2, 6380.00, 40.00, 3828.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1400.00, 1.00, NULL, 1, 1400.00, 100.00, 0.00, false);

    -- Paciente 2881 | Fecha: 2024-08-15 | Total: 12020.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2881, 1, '2024-08-15', 12020.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '37-36-35-34-', 4, 4200.00, 0.00, 4200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '45-46-47', 3, 3150.00, 0.00, 3150.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '44', 1, 1050.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '33-32-34-41-42-43', 6, 3900.00, 0.00, 3900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 145, 770.00, 1.00, NULL, 1, 770.00, 0.00, 770.00, false);

    -- Paciente 2881 | Fecha: 2024-12-05 | Total: 600.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2881, 1, '2024-12-05', 600.00, '{"A":"POSTERIOR AL TRATAMIENTO DE BLANQUEMIENTO DENTAL, SE DEBE CAMBIAN LAS RESINAS EXISTENTES"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 113, 600.00, 1.00, '14-13-23-24', 1, 600.00, 0.00, 600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2866 | Fecha: 2024-03-14 | Total: 42600.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2866, 1, '2024-03-14', 42600.00, '{"A":"SECUENCIA TRATAMIENTO\r\nQUIRURGICA: IMPLANTE\r\nPROTESICA: MUÑON Y CORONA SOBRE IMPLANTE"}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '14/24/46', 3, 21000.00, 0.00, 21000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1400.00, 1.00, '14/24/26/46', 4, 5600.00, 0.00, 5600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 311, 4000.00, 1.00, '14/24/26/46', 4, 16000.00, 0.00, 16000.00, false);

    -- Paciente 914 | Fecha: 2018-12-05 | Total: 11530.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (914, 1, '2018-12-05', 11530.00, NULL, 13)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 185, 3950.00, 1.00, '16', 1, 3950.00, 0.00, 3950.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 1890.00, 1.00, '16', 1, 1890.00, 0.00, 1890.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 380, 5690.00, 1.00, '16', 1, 5690.00, 0.00, 5690.00, false);

    -- Paciente 743 | Fecha: 2021-12-13 | Total: 25650.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (743, 1, '2021-12-13', 25650.00, '{"A":"ESTA ES LA ALTERNATIOVA QUE  RECOMIENDO POR EL CASO CLINICO","B":"ESTA ALTERNATIVA ES LA MENOS RECOMENDABLE, SU PRONOSTICO ES A CORTO PLAZO."}', 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 37, 1280.00, 1.00, '36', 1, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '36', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '36', 1, 1750.00, 0.00, 1750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 5000.00, 1.00, '36', 1, 5000.00, 0.00, 5000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1530.00, 1.00, '36', 2, 3060.00, 0.00, 3060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 640.00, 1.00, '36', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 37, 1280.00, 1.00, '36', 1, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 221, 2500.00, 1.00, '36', 1, 2500.00, 0.00, 2500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 221, 2500.00, 1.00, '36', 1, 2500.00, 0.00, 2500.00, false);

    -- Paciente 2494 | Fecha: 2020-08-19 | Total: 32150.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2494, 1, '2020-08-19', 32150.00, NULL, 13)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 384, 5690.00, 1.00, '12-11-21-22', 4, 22760.00, 0.00, 22760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2690.00, 1.00, '26', 1, 2690.00, 0.00, 2690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1010.00, 1.00, '26', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '26', 1, 5690.00, 0.00, 5690.00, false);

    -- Paciente 2495 | Fecha: 2020-08-20 | Total: 38700.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2495, 1, '2020-08-20', 38700.00, '{"A":"FASE A CIRUGIA: IMPLANTES\r\nFASE B REHABILITACION: TRANSCURRIDOS 4 A 5 MESES DE LA CIRUGIA SE REALIZARA REHABILITACION ES DECIR MUÑON Y CORONA SOBRE IMPLANTE.\r\nMAXILAS INFERIOR ELEMENTOS DENTALES 35,36 NO EXISTE SUFICIENTE HUESO"}', 13)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '22/24/26', 3, 21000.00, 0.00, 21000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 4150.00, 1.00, '22/24/26', 3, 12450.00, 0.00, 12450.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '22/24/26', 3, 5250.00, 0.00, 5250.00, false);

    -- Paciente 2496 | Fecha: 2020-08-27 | Total: 6860.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2496, 1, '2020-08-27', 6860.00, NULL, 13)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 36, 2030.00, 1.00, '38-48', 2, 4060.00, 0.00, 4060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 35, 1400.00, 1.00, '28-18', 2, 2800.00, 0.00, 2800.00, false);

    -- Paciente 2460 | Fecha: 2020-10-01 | Total: 19050.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2460, 1, '2020-10-01', 19050.00, '{"A":"PIEZA DENTARIA 47 POSIBLE TRATAMIENTO DE CONDUCTO COSTO 2690 BS, PIEZA DENTARIA 45 POSIBLE TRATAMIENTO DE CONDUCTO COSTO 2430 BS, PIEZAS DENTARIAS 34-33-32-31-41-42-43-44 SE REALIZARA EN FASE 2 OBTURACION SIMPLE COSTO C/U 640.- BS"}', 13)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '47', 1, 5690.00, 0.00, 5690.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '46-45-37-36', 4, 12720.00, 0.00, 12720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '47', 1, 640.00, 0.00, 640.00, false);

    -- Paciente 2460 | Fecha: 2021-03-23 | Total: 20701.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2460, 1, '2021-03-23', 20701.00, NULL, 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '14/15', 2, 1280.00, 20.00, 1024.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1100.00, 1.00, '14/15', 2, 2200.00, 20.00, 1760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '14/15', 2, 11380.00, 15.00, 9673.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '14/15', 2, 1280.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1210.00, 1.00, NULL, 1, 1210.00, 0.00, 1210.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 249, 640.00, 1.00, '14/15', 2, 1280.00, 20.00, 1024.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 224, 1100.00, 1.00, '14/15', 2, 2200.00, 20.00, 1760.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 241, 2500.00, 1.00, '14/15', 2, 5000.00, 15.00, 4250.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 640.00, 1.00, '14/15', 2, 1280.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 345, 1210.00, 1.00, NULL, 1, 1210.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2563 | Fecha: 2021-02-22 | Total: 38720.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2563, 1, '2021-02-22', 38720.00, '{"A":"PRONOSTICO RESERVADO POR FRACTURA SUB GINGIVAL","B":"IMPLANTE Y REHABILITACION CON CARGA INMEDIATA POST EXTRACCION","C":"EXTRACCION SE ESPERAN 3 MESES CIRUGIA DE IMPLANTE SE ESPERAN  MESES Y SE REHABIILTA, SE USA UNA PLACA PROVISIONAL DURANTE EL TIEMPO DE ESPERA"}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 163, 2670.00, 1.00, '24', 1, 2670.00, 0.00, 2670.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '24', 1, 1530.00, 0.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 2500.00, 1.00, '24', 1, 2500.00, 0.00, 2500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '24', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '24', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1750.00, 1.00, '24', 1, 1750.00, 0.00, 1750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 294, 5000.00, 1.00, '24', 1, 5000.00, 0.00, 5000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 34, 1010.00, 1.00, '24', 1, 1010.00, 0.00, 1010.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 292, 7000.00, 1.00, '24', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 293, 1750.00, 1.00, '24', 1, 1750.00, 0.00, 1750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 294, 5000.00, 1.00, '24', 1, 5000.00, 0.00, 5000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 221, 2500.00, 1.00, '24', 1, 2500.00, 0.00, 2500.00, false);

    -- Paciente 2563 | Fecha: 2021-02-23 | Total: 6700.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2563, 1, '2021-02-23', 6700.00, NULL, 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 163, 2670.00, 1.00, '24', 1, 2670.00, 0.00, 2670.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '24', 1, 1530.00, 0.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 2500.00, 1.00, '24', 1, 2500.00, 0.00, 2500.00, false);

    -- Paciente 3028 | Fecha: 2025-12-03 | Total: 81552.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (3028, 1, '2025-12-03', 81552.00, '{"C":"FASE  IMPLANTOLOGIA ANTERIOR, SE VALORARA LA NECESIDAD DE REALIZAR UN INJERTO DE TEJIDO CONECTIVO Y OSEO POR PERDIDA DE TEJIDO EN EL SECTOR","D":"FASE  IMPLANTOLOGIA POSTERIOR, SE VALORARA LA NECESIDAD DE REALIZAR UN INJERTO DE TEJIDO CONECTIVO Y OSEO POR PERDIDA DE TEJIDO EN EL SECTOR","B":"FASE DE REHABILITACION ANTERIOR","A":"FASE DE REHABILITACION ADITIVA POSTERIOR PARA ELEVAR DIMESION VERTICAL EN BASE AL ENCERADO DIAGNOSTICO"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 325, 2640.00, 1.00, '23', 1, 2640.00, 20.00, 2112.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 292, 10390.00, 1.00, '23', 1, 10390.00, 20.00, 8312.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 222, 2400.00, 1.00, '23', 1, 2400.00, 20.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 293, 2970.00, 1.00, '23', 1, 2970.00, 20.00, 2376.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 292, 10390.00, 1.00, '46', 1, 10390.00, 20.00, 8312.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 301, 5640.00, 1.00, '46', 1, 5640.00, 20.00, 4512.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 293, 2970.00, 1.00, '46', 1, 2970.00, 20.00, 2376.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 301, 5640.00, 1.00, '23', 1, 5640.00, 20.00, 4512.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 159, 5400.00, 1.00, '12-11-21-22', 4, 21600.00, 20.00, 17280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 3600.00, 1.00, '12-11-21-22', 4, 14400.00, 20.00, 11520.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1550.00, 1.00, '16-15-14-24-25-26', 6, 9300.00, 20.00, 7440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 960.00, 1.00, '37-35-34-45-46-47', 6, 5760.00, 20.00, 4608.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 960.00, 1.00, '33-43', 2, 1920.00, 20.00, 1536.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 34, 1600.00, 1.00, '46', 1, 1600.00, 20.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'D', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 1080.00, 1.00, '12/21/22', 4, 4320.00, 20.00, 3456.00, false);

    -- Paciente 3037 | Fecha: 2026-02-27 | Total: 9900.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (3037, 1, '2026-02-27', 9900.00, NULL, 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 253, 4700.00, 1.00, '12', 1, 4700.00, 0.00, 4700.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1200.00, 1.00, '12-11-21', 3, 3600.00, 0.00, 3600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1600.00, 1.00, '12', 1, 1600.00, 0.00, 1600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2545 | Fecha: 2026-03-23 | Total: 7000.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2545, 1, '2026-03-23', 7000.00, '{"A":"SE RECOMIENDA:\r\n1.- ORTODONCIA\r\n2.- REHABILITACION TOTAL\r\n3.- INCRUSTACIONES POR DESGASTE EN MISMA OCLUSION"}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3500.00, 1.00, '27-26', 2, 7000.00, 0.00, 7000.00, false);

    -- Paciente 2570 | Fecha: 2021-03-15 | Total: 14640.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2570, 1, '2021-03-15', 14640.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '33-32', 2, 2020.00, 0.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 209, 2280.00, 1.00, NULL, 1, 2280.00, 0.00, 2280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 162, 2470.00, 1.00, '33-32', 2, 4940.00, 0.00, 4940.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 1530.00, 1.00, '33-32', 2, 3060.00, 0.00, 3060.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 640.00, 1.00, '33-32', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 204, 1060.00, 1.00, NULL, 1, 1060.00, 0.00, 1060.00, false);

    -- Paciente 701 | Fecha: 2021-04-20 | Total: 45000.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (701, 1, '2021-04-20', 45000.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 195, 2700.00, 1.00, '35-34-42-44-45', 5, 13500.00, 0.00, 13500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 301, 4500.00, 1.00, '36-33-32-31', 4, 18000.00, 0.00, 18000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 301, 4500.00, 1.00, '41-43-46', 3, 13500.00, 0.00, 13500.00, false);

    -- Paciente 251 | Fecha: 2021-04-28 | Total: 27500.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (251, 1, '2021-04-28', 27500.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '14/24', 2, 14000.00, 0.00, 14000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '14/24', 2, 3500.00, 0.00, 3500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 5000.00, 1.00, '14/24', 2, 10000.00, 0.00, 10000.00, false);

    -- Paciente 11 | Fecha: 2021-06-14 | Total: 4930.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (11, 1, '2021-06-14', 4930.00, NULL, 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 161, 2870.00, 1.00, '17', 1, 2870.00, 0.00, 2870.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '17', 1, 1050.00, 0.00, 1050.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1010.00, 1.00, '17', 1, 1010.00, 0.00, 1010.00, false);

    -- Paciente 1470 | Fecha: 2021-06-22 | Total: 102900.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1470, 1, '2021-06-22', 102900.00, NULL, 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 237, 2670.00, 1.00, NULL, 1, 2670.00, 0.00, 2670.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '17/15', 2, 6360.00, 0.00, 6360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '16/14', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 380, 5690.00, 1.00, '16/14', 2, 11380.00, 0.00, 11380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 5690.00, 1.00, '13/12/11/21/22/23', 6, 34140.00, 0.00, 34140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 94, 520.00, 1.00, '33/32/31/41/42/43', 6, 3120.00, 0.00, 3120.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 237, 2670.00, 1.00, NULL, 1, 2670.00, 0.00, 2670.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3180.00, 1.00, '17/15', 2, 6360.00, 0.00, 6360.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 249, 640.00, 1.00, '16/14', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 380, 5690.00, 1.00, '16/14', 2, 11380.00, 0.00, 11380.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 115, 3190.00, 1.00, '13/12/11/21/22/23', 6, 19140.00, 0.00, 19140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 94, 520.00, 1.00, '33/32/31/41/42/43', 6, 3120.00, 0.00, 3120.00, false);

    -- Paciente 470 | Fecha: 2021-06-25 | Total: 53350.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (470, 1, '2021-06-25', 53350.00, NULL, 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '14-25-26-35-36-37', 6, 42000.00, 0.00, 42000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 326, 850.00, 1.00, NULL, 1, 850.00, 0.00, 850.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, NULL, 6, 10500.00, 0.00, 10500.00, false);

    -- Paciente 2164 | Fecha: 2021-06-30 | Total: 72750.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2164, 1, '2021-06-30', 72750.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '42/44/45/46', 4, 28000.00, 0.00, 28000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 323, 21000.00, 1.00, NULL, 1, 21000.00, 0.00, 21000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 2500.00, 1.00, '31/32/33/34', 4, 10000.00, 0.00, 10000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '36', 1, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '36', 1, 1750.00, 0.00, 1750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 5000.00, 1.00, '36', 1, 5000.00, 0.00, 5000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2164 | Fecha: 2021-07-14 | Total: 121303.50
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2164, 1, '2021-07-14', 121303.50, '{"A":"TRATAMIENTO MAXILAR INFERIOR IZQUIERDO. \r\nPOSIBLE ENDODONCIA EN CADA ELEMENTO DENTAL","B":"TRATAMIENTO MAXILAR INFERIOR DERECHO","C":"TRATAMIENTO MAXILAR INFERIOR DERECHO"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 2500.00, 1.00, '31/32/33/34/35', 5, 12500.00, 15.00, 10625.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '36', 1, 7000.00, 15.00, 5950.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 327, 2310.00, 1.00, '36', 1, 2310.00, 15.00, 1963.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 301, 4500.00, 1.00, '36', 1, 4500.00, 15.00, 3825.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 7000.00, 1.00, '41/43/45/46', 4, 28000.00, 15.00, 23800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 1750.00, 1.00, '41/43/45/46', 4, 7000.00, 15.00, 5950.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 301, 4500.00, 1.00, '41/43/45/46', 4, 18000.00, 15.00, 15300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 195, 2700.00, 1.00, '42/44', 2, 5400.00, 15.00, 4590.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 326, 850.00, 1.00, NULL, 1, 850.00, 0.00, 850.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 292, 7000.00, 1.00, '41/43/45/46', 4, 28000.00, 15.00, 23800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 293, 1750.00, 1.00, '41/43/5/46', 4, 7000.00, 15.00, 5950.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 323, 21000.00, 1.00, '41/42/43/44/45/46', 1, 21000.00, 15.00, 17850.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 326, 850.00, 1.00, NULL, 1, 850.00, 0.00, 850.00, false);

    -- Paciente 2663 | Fecha: 2022-01-14 | Total: 4230.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2663, 1, '2022-01-14', 4230.00, NULL, 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '27-37', 1, 1050.00, 0.00, 1050.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '47', 1, 3180.00, 0.00, 3180.00, false);

    -- Paciente 820 | Fecha: 2024-04-19 | Total: 10220.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (820, 1, '2024-04-19', 10220.00, NULL, 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 145, 770.00, 1.00, NULL, 1, 770.00, 0.00, 770.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1240.00, 1.00, '34-35-43-45-46', 5, 6200.00, 0.00, 6200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '33-32-31-41-42', 5, 3250.00, 0.00, 3250.00, false);

    -- Paciente 2188 | Fecha: 2024-04-30 | Total: 39050.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2188, 1, '2024-04-30', 39050.00, '{"A":"SE DEBE REALIZAR REHABILITACION TOTAL CON ELEVADO DE MORDIDA POR PRESENTAR OCLUSION TRAUMATICA.\r\nSE RECOMIENDA GUARDA OCLUSAL PARA PROTECCION DE TRATAMIENTO"}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '35/36/37/45/46/47', 6, 19080.00, 0.00, 19080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 135, 2100.00, 1.00, '13/12/11/21/22/23', 6, 12600.00, 0.00, 12600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '33/32/31/41/42/43', 6, 3900.00, 0.00, 3900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1400.00, 1.00, NULL, 1, 1400.00, 0.00, 1400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 145, 770.00, 1.00, NULL, 1, 770.00, 0.00, 770.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '11-21', 2, 1300.00, 0.00, 1300.00, false);

    -- Paciente 1124 | Fecha: 2024-05-17 | Total: 83940.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1124, 1, '2024-05-17', 83940.00, '{"A":"DESPUES DE TRES MESES SE EVALUARA POSIBILIDAD DE IMPLANTES CORRESPONDIENTES A ELEMENTOS DENTALES 16/25"}', 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '16/25', 2, 2020.00, 0.00, 2020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 82, 3830.00, 1.00, '16/25', 2, 7660.00, 0.00, 7660.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 60, 1520.00, 1.00, '26/37/46', 3, 4560.00, 0.00, 4560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 237, 2670.00, 1.00, NULL, 1, 2670.00, 0.00, 2670.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 272, 800.00, 1.00, NULL, 1, 800.00, 0.00, 800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 249, 640.00, 1.00, '24', 1, 640.00, 0.00, 640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 115, 3190.00, 1.00, '13/12/11/21/22/23', 6, 19140.00, 0.00, 19140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 197, 3180.00, 1.00, '37/35/34', 3, 9540.00, 0.00, 9540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 197, 3180.00, 1.00, '44/45/46/47', 4, 12720.00, 0.00, 12720.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 115, 3190.00, 1.00, '33/32/31/41/42/43', 6, 19140.00, 0.00, 19140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 116, 650.00, 1.00, '36', 1, 650.00, 0.00, 650.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 241, 3000.00, 1.00, '24', 1, 3000.00, 0.00, 3000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 345, 1400.00, 1.00, NULL, 1, 1400.00, 0.00, 1400.00, false);

    -- Paciente 1604 | Fecha: 2024-06-18 | Total: 11670.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1604, 1, '2024-06-18', 11670.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 86, 640.00, 1.00, '12-11', 2, 1280.00, 0.00, 1280.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 3190.00, 1.00, '22', 1, 3190.00, 0.00, 3190.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 3000.00, 1.00, '11/21', 2, 6000.00, 0.00, 6000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 113, 600.00, 1.00, '13-23', 2, 1200.00, 0.00, 1200.00, false);

    -- Paciente 2413 | Fecha: 2025-07-23 | Total: 59180.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2413, 1, '2025-07-23', 59180.00, '{"A":"MUÑON Y CORONAS PROVISORIAS SOBRE IMPLANTE SE VALORARAN EN ACTO QUIRURGICO\r\n2-4 MESES POSTERIOR CIRUGIA IMPLANTE, FASE DEFINITIVA DE  MUÑON Y CORONA PORCELANA."}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 1200.00, 1.00, '45-47', 2, 2400.00, 0.00, 2400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 10390.00, 1.00, '45-46', 2, 20780.00, 0.00, 20780.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 321, 1320.00, 1.00, '45-46', 2, 2640.00, 0.00, 2640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 222, 2400.00, 1.00, '45-46', 2, 4800.00, 0.00, 4800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2970.00, 1.00, '45-46', 2, 5940.00, 0.00, 5940.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 218, 7560.00, 1.00, '45-46', 2, 15120.00, 0.00, 15120.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 3750.00, 1.00, '48', 1, 3750.00, 0.00, 3750.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 346, 3750.00, 1.00, NULL, 1, 3750.00, 0.00, 3750.00, false);

    -- Paciente 36 | Fecha: 2025-05-06 | Total: 6300.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (36, 1, '2025-05-06', 6300.00, '{"A":"DE ACUERDO A LA EVOLUCION SE RECOMIENDA EL CAMBIO A CORONA DEFINITIVA"}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 3820.00, 1.00, '36', 1, 3820.00, 0.00, 3820.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1680.00, 1.00, '36', 1, 1680.00, 0.00, 1680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 800.00, 1.00, '36', 1, 800.00, 0.00, 800.00, false);

    -- Paciente 36 | Fecha: 2025-05-06 | Total: 2720.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (36, 1, '2025-05-06', 2720.00, NULL, 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 60, 2720.00, 1.00, '16', 1, 2720.00, 0.00, 2720.00, false);

    -- Paciente 2992 | Fecha: 2025-05-12 | Total: 4000.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2992, 1, '2025-05-12', 4000.00, NULL, 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 123, 2000.00, 1.00, NULL, 2, 4000.00, 0.00, 4000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2331 | Fecha: 2025-05-14 | Total: 5020.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2331, 1, '2025-05-14', 5020.00, '{"A":"PACIENTE REQUIERE DE ORTODONCIA INTERCEPTIVA POR APIÑAMIENTO ANTERIOR."}', 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 354, 2510.00, 1.00, NULL, 2, 5020.00, 0.00, 5020.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2986 | Fecha: 2025-06-26 | Total: 29660.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2986, 1, '2025-06-26', 29660.00, '{"A":"MAXILAR INFERIOR\r\nSECTOR 4 - POST EXTRACCIONES MOLARES\r\nSECTOR 3 - IMPLANTE 37"}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 960.00, 1.00, '12-11-21', 3, 2880.00, 0.00, 2880.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 960.00, 1.00, '32-31-41-42-47', 5, 4800.00, 0.00, 4800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1550.00, 1.00, '14-26', 2, 3100.00, 0.00, 3100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 4720.00, 1.00, '16-15-36-35', 4, 18880.00, 0.00, 18880.00, false);

    -- Paciente 2986 | Fecha: 2025-11-25 | Total: 2640.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2986, 1, '2025-11-25', 2640.00, NULL, 20)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 2640.00, 1.00, NULL, 1, 2640.00, 0.00, 2640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 330 | Fecha: 2025-07-08 | Total: 864.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (330, 1, '2025-07-08', 864.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 1080.00, 1.00, '36', 1, 1080.00, 20.00, 864.00, false);

    -- Paciente 321 | Fecha: 2025-07-10 | Total: 8160.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (321, 1, '2025-07-10', 8160.00, NULL, 20)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 215, 7200.00, 1.00, '17-16-15', 1, 7200.00, 0.00, 7200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 960.00, 1.00, '13', 1, 960.00, 0.00, 960.00, false);

    -- Paciente 312 | Fecha: 2023-11-20 | Total: 62730.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (312, 1, '2023-11-20', 62730.00, '{"A":"EXPLICAR A PACIENTE QUE SE MODIFICARA OCLUCION EN SECTOR 2 O COMPENSAR EN PROTESIS INFERIOR IZQUIERDA\r\nMEDIANO PLAZO RETIRAR CORONAS METAL CERAMICA Y EXODONCIAS PARA REALIZAR PROTESIS HIBRIDA\r\nMAXILAR INFERIOR REQUIERE PROTESIS PARCIAL ROMOVIBLE"}', 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '12/21/23', 3, 3030.00, 0.00, 3030.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 239, 2550.00, 1.00, NULL, 2, 5100.00, 0.00, 5100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '11/21/23/25', 4, 28000.00, 0.00, 28000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1400.00, 1.00, '11/21/23/25', 4, 5600.00, 0.00, 5600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 323, 21000.00, 1.00, NULL, 1, 21000.00, 0.00, 21000.00, false);

    -- Paciente 312 | Fecha: 2023-11-21 | Total: 4236.40
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (312, 1, '2023-11-21', 4236.40, '{"A":"PLANIFICACION DE IMPLANTE- REHABILITACION, DR. ALFREDO ANTEQUERA"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '11/21/23', 3, 3030.00, 70.00, 909.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 239, 2550.00, 1.00, NULL, 2, 5100.00, 70.00, 1530.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 165, 760.00, 1.00, '17', 1, 760.00, 70.00, 228.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 159, 2870.00, 1.00, '44', 1, 2870.00, 68.00, 918.40, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 1530.00, 1.00, '44', 1, 1530.00, 70.00, 459.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '44', 1, 640.00, 70.00, 192.00, false);

    -- Paciente 312 | Fecha: 2025-07-15 | Total: 110640.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (312, 1, '2025-07-15', 110640.00, '{"A":"EXISTE POSIBILIDAD DE REALIZAR TRATAMIENTO DE CONDUCTO EN CASO QUE EXISTA HIRSENSIBILIDAD POSTERIOR A LA PREPARACION DE CARILLA O CEMENTACION"}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 245, 7200.00, 1.00, '33-32-31-41-42-43', 6, 43200.00, 0.00, 43200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 245, 7200.00, 1.00, '43-33', 2, 14400.00, 0.00, 14400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 6000.00, 1.00, '33-32-31-41-42-43', 6, 36000.00, 0.00, 36000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 6000.00, 1.00, '44-34', 2, 12000.00, 0.00, 12000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 5040.00, 1.00, NULL, 1, 5040.00, 0.00, 5040.00, false);

    -- Paciente 2465 | Fecha: 2021-09-02 | Total: 10477.50
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2465, 1, '2021-09-02', 10477.50, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 173, 3170.00, 1.00, '47', 1, 3170.00, 25.00, 2377.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '47', 1, 1050.00, 25.00, 787.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '37', 1, 7000.00, 50.00, 3500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 1750.00, 1.00, '37', 1, 1750.00, 25.00, 1312.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 294, 5000.00, 1.00, '37', 1, 5000.00, 50.00, 2500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 1141 | Fecha: 2022-04-25 | Total: 552.50
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1141, 1, '2022-04-25', 552.50, NULL, 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '45', 1, 650.00, 15.00, 552.50, false);

    -- Paciente 2303 | Fecha: 2022-05-24 | Total: 4300.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2303, 1, '2022-05-24', 4300.00, NULL, 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 123, 1800.00, 1.00, NULL, 2, 3600.00, 0.00, 3600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 132, 350.00, 1.00, '32-31-41-42', 4, 1400.00, 50.00, 700.00, false);

    -- Paciente 297 | Fecha: 2022-05-25 | Total: 9420.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (297, 1, '2022-05-25', 9420.00, NULL, 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '47-46-43', 3, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 241, 2500.00, 1.00, '47-46-45', 3, 7500.00, 0.00, 7500.00, false);

    -- Paciente 3039 | Fecha: 2025-12-23 | Total: 2640.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (3039, 1, '2025-12-23', 2640.00, NULL, 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 2640.00, 1.00, NULL, 1, 2640.00, 0.00, 2640.00, false);

    -- Paciente 2777 | Fecha: 2023-11-07 | Total: 79250.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2777, 1, '2023-11-07', 79250.00, NULL, 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '47-45-44-36-35-34', 6, 19080.00, 0.00, 19080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '33-32-31-41-42-43', 6, 3840.00, 0.00, 3840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 115, 3190.00, 1.00, '33-32-31-41-42-43', 6, 19140.00, 0.00, 19140.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '16', 1, 3180.00, 0.00, 3180.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '13-12-11-21-22-23', 6, 3840.00, 0.00, 3840.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4000.00, 1.00, '13-12-11-21-22-23', 6, 24000.00, 0.00, 24000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4000.00, 1.00, '14', 1, 4000.00, 0.00, 4000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 145, 770.00, 1.00, NULL, 1, 770.00, 0.00, 770.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1400.00, 1.00, NULL, 1, 1400.00, 0.00, 1400.00, false);

    -- Paciente 1660 | Fecha: 2023-11-13 | Total: 4493.60
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1660, 1, '2023-11-13', 4493.60, '{"A":"SE RECOMIENDA\r\nCAMBIO DE CORONA POR LA DEFINITIVA (46, PRIMERO MORALR INFERIOR DERECHO)\r\nOBTURACIONES POR CARIES EN DIENTES ANERIORES SUPERIORES (21-11), POSIBLE TRATAMIENTO DE ENDODONCIA POR PORFUNDIDAD DE CARIES"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 3000.00, 1.00, '46', 1, 3000.00, 18.00, 2460.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1240.00, 1.00, '11-21', 2, 2480.00, 18.00, 2033.60, false);

    -- Paciente 2309 | Fecha: 2023-11-13 | Total: 4493.60
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2309, 1, '2023-11-13', 4493.60, '{"A":"EXISTE LA POSIBILIDAD DE NECESITAR TRATAMIENTO DE ENDODONCIA POR PROFUNDIDAD DE LESION CARIOSA"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 3000.00, 1.00, '46', 1, 3000.00, 18.00, 2460.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 640.00, 1.00, '46', 1, 640.00, 100.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1240.00, 1.00, '11-21', 2, 2480.00, 18.00, 2033.60, false);

    -- Paciente 558 | Fecha: 2023-11-16 | Total: 29459.40
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (558, 1, '2023-11-16', 29459.40, '{"A":"SE VALORARA CARILLAS DE PREMOLARES (14-24) POR ARMONIZACION ESTETICA\r\n\r\nEXISTE LA POSIBILIDA DE REALIZAR TRATAMIENTO DE ENDODONCIA EN CASO DE HIPERSENSIBILIDAD POR TALLADO DENTAL"}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 131, 770.00, 1.00, '14-24', 1, 770.00, 18.00, 631.40, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 640.00, 1.00, '13-11-23', 3, 1920.00, 25.00, 1440.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4000.00, 1.00, '13-12-11-21-22-23', 6, 24000.00, 18.00, 19680.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 177, 4000.00, 1.00, '14-24', 2, 8000.00, 18.00, 6560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1400.00, 1.00, NULL, 1, 1400.00, 18.00, 1148.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2809 | Fecha: 2023-11-20 | Total: 30200.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2809, 1, '2023-11-20', 30200.00, '{"A":"14/15 SE ACONSEJA INCRUSTACION CEROMERO\r\n37 POSIBLE EXTRACCION SI NO EXISTE EVOLUCION DE RETRATAMIENTO"}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3180.00, 1.00, '17/16/14', 3, 9540.00, 0.00, 9540.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1240.00, 1.00, '13', 1, 1240.00, 0.00, 1240.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '24/25/37/34/47', 5, 5250.00, 0.00, 5250.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 3470.00, 1.00, '37', 1, 3470.00, 0.00, 3470.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 218, 4000.00, 1.00, '36/46', 2, 8000.00, 0.00, 8000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '33/43', 2, 1300.00, 0.00, 1300.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 1400.00, 1.00, NULL, 1, 1400.00, 0.00, 1400.00, false);

    -- Paciente 638 | Fecha: 2023-11-29 | Total: 4050.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (638, 1, '2023-11-29', 4050.00, '{"A":"SE RECOMIENDA CAMBIO DE OBTURACIONES 15 DIAS POST BLANQUEMINTO, PARA DEVOLVER ESTETICA Y FUNCION, SE HABLA CON ORTODONCISTA POR LA FUNCION QUE FALTA"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1050.00, 1.00, '11-21', 2, 2100.00, 0.00, 2100.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 650.00, 1.00, '12-22-43', 3, 1950.00, 0.00, 1950.00, false);

    -- Paciente 1457 | Fecha: 2024-03-04 | Total: 3600.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1457, 1, '2024-03-04', 3600.00, NULL, 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 123, 1800.00, 1.00, NULL, 2, 3600.00, 0.00, 3600.00, false);

    -- Paciente 230 | Fecha: 2024-03-06 | Total: 30863.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (230, 1, '2024-03-06', 30863.00, '{"A":"TRATAMIENTO A REALIZARSSE EN LA CIUDAD DE SUCRE A CARGO DE DR XAVIER ZAMURIANO.\r\nEL DESARROLLO-PLANIFICACION DE TRATAMIENTO HA SIDO EXPLICADO A PACIENTE"}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 292, 7000.00, 1.00, '16-17', 2, 14000.00, 30.00, 9800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '38-35-34-33-32-31', 6, 6060.00, 30.00, 4242.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1010.00, 1.00, '41-42-43', 3, 3030.00, 30.00, 2121.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 323, 21000.00, 1.00, NULL, 1, 21000.00, 30.00, 14700.00, false);

    -- Paciente 3021 | Fecha: 2025-09-11 | Total: 53980.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (3021, 1, '2025-09-11', 53980.00, '{"A":"REQUIERE CONTROL RADIOGRAFICO  CADA 3-6-9-12 MESES\r\nREQUIERE EVALUACION DE OCLUSION TRAUMATICA. PRONOSTICO RESERVADO\r\nEXISTE POSIBILIDAD DE EXTRACCION DENTAL DURANTE CIRUGIA","B":"FASE A: EXTRACCION + INJERTO DE HUESO CON MEMBRANA\r\nFASE B: TRASNCURRIDO 2 A 4 MESES DE EXTRACCION, CIRUGIA DE IMPLANTE.\r\nFASE C: TRANSCURRIDO 4 A 6 MESES DE CIRUGIA DE IMPLANTE, REHABILITACION MUÑON SOBRE IMPLANTE Y CORONA SOBRE IMPLANTE."}', 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 1200.00, 1.00, '14', 1, 1200.00, 0.00, 1200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 160, 6000.00, 1.00, '14', 1, 6000.00, 0.00, 6000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 2040.00, 1.00, '14', 1, 2040.00, 0.00, 2040.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 32, 7800.00, 1.00, '14', 1, 7800.00, 0.00, 7800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 1080.00, 1.00, '14', 1, 1080.00, 0.00, 1080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 37, 2640.00, 1.00, '14', 1, 2640.00, 0.00, 2640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 10390.00, 1.00, '14', 1, 10390.00, 0.00, 10390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 93, 7500.00, 1.00, '14', 1, 7500.00, 0.00, 7500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 2970.00, 1.00, '14', 1, 2970.00, 0.00, 2970.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 311, 7560.00, 1.00, '14', 1, 7560.00, 0.00, 7560.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 239, 4800.00, 1.00, '14', 1, 4800.00, 0.00, 4800.00, false);

    -- Paciente 2943 | Fecha: 2025-09-23 | Total: 31360.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2943, 1, '2025-09-23', 31360.00, NULL, 5)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1920.00, 1.00, '15', 1, 1920.00, 0.00, 1920.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 253, 5640.00, 1.00, '15/14/16', 1, 5640.00, 0.00, 5640.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 239, 4800.00, 1.00, '15', 1, 4800.00, 0.00, 4800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 10390.00, 1.00, '15', 1, 10390.00, 0.00, 10390.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 2970.00, 1.00, '15', 1, 2970.00, 0.00, 2970.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 301, 5640.00, 1.00, '15', 1, 5640.00, 0.00, 5640.00, false);

    -- Paciente 2244 | Fecha: 2026-03-24 | Total: 154940.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2244, 1, '2026-03-24', 154940.00, '{"A":"PLAN DE TRATAMIENTO RADICAL , ELEMENTOS DENTALES CON REABSORCION OSEA AVANZADA 31/41.\r\nCARIES EXTENSAS Y PROFUNDAS REQUIERE ENDODONCIA","B":"PLAN DE TRATAMIENTO CONSERVADOR SIN EXTRACCIONES Y TRATAMIENTOS DE CONDUCTOS SELECCIONADOS\r\nSE EVALUARA SINTOMATOLOGIA DE ELEMENTOS DENTALES 32/33/34/44, POSIBLE TRATAMIENTO DE CONDUCTOS"}', 9)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 34, 1600.00, 1.00, '31/41', 2, 3200.00, 0.00, 3200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 3900.00, 1.00, '34/33/42/43/44', 5, 19500.00, 0.00, 19500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 201, 3000.00, 1.00, '35/42/43', 3, 9000.00, 0.00, 9000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 1080.00, 1.00, '31/32/33/34/35', 5, 5400.00, 0.00, 5400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 1080.00, 1.00, '41/42/43/44', 4, 4320.00, 0.00, 4320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 3500.00, 1.00, '31/32/33/34/35', 5, 17500.00, 0.00, 17500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 3500.00, 1.00, '41/42/43/44', 4, 14000.00, 0.00, 14000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 850.00, 1.00, NULL, 1, 850.00, 0.00, 850.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 171, 4600.00, 1.00, '31/41/42/43', 4, 18400.00, 0.00, 18400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 201, 3000.00, 1.00, '35/31/41/42/43', 5, 15000.00, 0.00, 15000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 1080.00, 1.00, '31/32/33/34/35', 5, 5400.00, 0.00, 5400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 1080.00, 1.00, '41/42/43/44', 4, 4320.00, 0.00, 4320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 241, 3500.00, 1.00, '31/32/33/34/35', 5, 17500.00, 0.00, 17500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 241, 3500.00, 1.00, '41/42/43/44', 4, 14000.00, 0.00, 14000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 79, 850.00, 1.00, NULL, 1, 850.00, 0.00, 850.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1900.00, 1.00, '34/33/32', 3, 5700.00, 0.00, 5700.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 3076 | Fecha: 2026-04-29 | Total: 12200.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (3076, 1, '2026-04-29', 12200.00, '{"A":"SE RECOMIENDA VALORACION CON ORTODONCIA POR MORDIDA ANTERIOR ABIERTA\r\n\r\nDE ACUERDO A ENCERADO, SE REALIZA PLAN DE TRATAMIENTO CON OBTURACIONES DIRECTAS PARA MEJORAR ESTETICA ANTERIOR, EN FORMA. \r\n\r\nPARA MEJORAR COLOR, SE REACOMIENDA BLANQUEMIENTO DENTAL, POR PRESENTAR INCISIVO SUPERIOR CENTRAL IZQUIERDO(21)MAS SATURADO POR ENDODONCIA"}', 10)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 131, 1800.00, 1.00, '13-23/33-43', 1, 1800.00, 0.00, 1800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1200.00, 1.00, '14-13-12-11-21-22', 6, 7200.00, 0.00, 7200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 800.00, 1.00, '32-31-41-42', 4, 3200.00, 0.00, 3200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 3082 | Fecha: 2026-05-05 | Total: 7650.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (3082, 1, '2026-05-05', 7650.00, NULL, 24)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 2, 450.00, 1.00, NULL, 1, 450.00, 0.00, 450.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 209, 3600.00, 1.00, NULL, 2, 7200.00, 0.00, 7200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 3095 | Fecha: 2026-05-22 | Total: 2450.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (3095, 1, '2026-05-22', 2450.00, '{"A":"POST LIMPIEZA SE VERIFICA DIAGNOSTICO.\r\nSE RECOMIENDA ORTODONCIA"}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 79, 850.00, 1.00, NULL, 1, 850.00, 0.00, 850.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 800.00, 1.00, '16-11', 2, 1600.00, 0.00, 1600.00, false);

    -- Paciente 3066 | Fecha: 2026-06-01 | Total: 41670.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (3066, 1, '2026-06-01', 41670.00, '{"A":"MAXILAR INFERIOR\r\nTRATAMIENTO DE REHABILITACION ORAL ADHESIVA FUNCIONAL, ELEVADO DE DIMENSION VERTICAL POSTERIOR Y ACOPLE ANTERIOR","B":"MAXILAR SUPERIOR POSTERIOR\r\nTRATAMIENTO DE REHABILITACION ORAL ADHESIVA FUNCIONAL, ELEVADO DE DIMENSION VERTICAL POSTERIOR","C":"FASE QUIRURGICA\r\n1 FASE EXTRACCION + CORONA PROVISIONAL\r\n2 FASE IMPLANTE\r\n3 FASE CORONA DEFINITIVA"}', 20)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 800.00, 1.00, '36-35-34-44-46', 5, 4000.00, 0.00, 4000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 800.00, 1.00, '33-32-31-41-42-43', 6, 4800.00, 0.00, 4800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3500.00, 1.00, '45-47', 2, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 800.00, 1.00, '14-24-25', 3, 2400.00, 0.00, 2400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3500.00, 1.00, '26', 1, 3500.00, 0.00, 3500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 34, 1600.00, 1.00, '15', 1, 1600.00, 0.00, 1600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 292, 8700.00, 1.00, '15', 1, 8700.00, 0.00, 8700.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 293, 2970.00, 1.00, '15', 1, 2970.00, 0.00, 2970.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 311, 4500.00, 1.00, '15', 1, 4500.00, 0.00, 4500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'C', 222, 2200.00, 1.00, '15', 1, 2200.00, 0.00, 2200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 2998 | Fecha: 2026-06-18 | Total: 22873.50
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2998, 1, '2026-06-18', 22873.50, '{"A":"SE RECOMIENDA CAMBIO DE SISTEMA DE REHABILITACION, POR DESADAPTACION, ACUMULO DE RESTOS ALIMENTICIOS Y BACTERIAS"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 293, 2970.00, 1.00, '14-16-17', 3, 8910.00, 15.00, 7573.50, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 311, 4500.00, 1.00, '14-16-17', 3, 13500.00, 15.00, 11475.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 218, 4500.00, 1.00, '15', 1, 4500.00, 15.00, 3825.00, false);

    -- Paciente 3071 | Fecha: 2026-06-26 | Total: 44300.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (3071, 1, '2026-06-26', 44300.00, '{"A":"PAGO INICIAL 5.300 BS.\r\nPAGOS MENSUALES A 12 MESES BS. 625.-\r\nAL FINALIZAR EL TRATAMIENTO DE ORTODONCIA SE COLOCA  RETENEDOR","B":"PAGO INICIAL 5.500 BS.\r\nPAGOS MENSUALES A 12 MESES  BS. 1875.-\r\nAL FINALIZAR EL  TRATAMIENO DE ORTODONCIA SE COLOCA LOS RETENEDORES EN AMBAS ARCADAS."}', 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 368, 12500.00, 1.00, NULL, 1, 12500.00, 0.00, 12500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 368, 12500.00, 1.00, NULL, 1, 12500.00, 0.00, 12500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 370, 13500.00, 1.00, NULL, 1, 13500.00, 0.00, 13500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 375, 700.00, 1.00, NULL, 4, 2800.00, 0.00, 2800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 367, 1000.00, 1.00, NULL, 1, 1000.00, 0.00, 1000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 367, 1000.00, 1.00, NULL, 1, 1000.00, 0.00, 1000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 366, 1000.00, 1.00, NULL, 1, 1000.00, 0.00, 1000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 238 | Fecha: 2026-07-06 | Total: 4505.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (238, 1, '2026-07-06', 4505.00, '{"A":"TRATAMIENTO SE REALIZA EN CONSULTORIO Y SE ENTREGAN PLACAS PARA CONTINUAR CON TRATAMIENTO AMBULATORIO EN CASA ( 15 DIAS APROX)\r\nLA EFECTIVIDAD DEPENDE DE LOS HABITOS DEL PACIENTE."}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 138, 5300.00, 1.00, NULL, 1, 5300.00, 15.00, 4505.00, false);

    -- Paciente 2855 | Fecha: 2026-07-15 | Total: 1480.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (2855, 1, '2026-07-15', 1480.00, NULL, 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 121, 1850.00, 1.00, '21-22', 2, 3700.00, 60.00, 1480.00, false);

    -- Paciente 3097 | Fecha: 2026-07-20 | Total: 7680.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (3097, 1, '2026-07-20', 7680.00, '{"A":"26 POSIBLE TRATAMIENTO DE CONDUCTOS\r\n25 CAMBIO DE CORONA DEFINITIVA EN TRES MESES BS 3.500.-\r\nSE RECOMIENDA LIMPIEZA DENTAL."}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 162, 3900.00, 1.00, '25', 1, 3900.00, 0.00, 3900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1900.00, 1.00, '25', 1, 1900.00, 0.00, 1900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 183, 1080.00, 1.00, '25', 1, 1080.00, 0.00, 1080.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 800.00, 1.00, '26', 1, 800.00, 0.00, 800.00, false);

    -- Paciente 3116 | Fecha: 2026-07-21 | Total: 7000.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (3116, 1, '2026-07-21', 7000.00, '{"A":"PACIENTE PRESENTA TRAUMA DE OCLUSION.\r\nSE RECOMIENDA REORTODONCIA"}', 2)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 131, 600.00, 1.00, NULL, 1, 600.00, 0.00, 600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1200.00, 1.00, '12/11821/22', 4, 4800.00, 0.00, 4800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 800.00, 1.00, '13/23', 2, 1600.00, 0.00, 1600.00, false);

    -- Paciente 3115 | Fecha: 2026-07-23 | Total: 8000.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (3115, 1, '2026-07-23', 8000.00, '{"A":"PRESUPUESTO DEL SECTOR POSTERIOR","B":"INCISIVO CENTRAL DERECHO POSIBLE TRATAMIENTO DE ENDODONCIA DE ACUERDO A SINTOMATOLOGIA POR TRAUA PREVIO"}', 19)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 197, 3500.00, 1.00, '36', 1, 3500.00, 0.00, 3500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 800.00, 1.00, '37', 1, 800.00, 0.00, 800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 121, 1850.00, 1.00, '21-11', 2, 3700.00, 0.00, 3700.00, false);

    -- Paciente 1156 | Fecha: 2026-07-28 | Total: 12670.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (1156, 1, '2026-07-28', 12670.00, '{"A":"25 SUPERIOR IZQUIERDA, CIRUGIA IMPLANTE, VALORAR SI ES POSIBLE CORONA INMEDIATA.\r\nIMPLANTE BS.8700.- MUÑON SOBRE IMPLANTE BS. 3600, CORONA SOBRE IMPLANTES BS. 4500.-\r\nCOSTO DE MUÑON+CORONA PROVISORIA BS. 2480"}', 1)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 215, 7200.00, 1.00, '25', 1, 7200.00, 25.00, 5400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 325, 2200.00, 1.00, '46', 1, 2200.00, 15.00, 1870.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 215, 7200.00, 1.00, '45/46', 1, 7200.00, 25.00, 5400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 577 | Fecha: 2026-07-28 | Total: 75220.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (577, 1, '2026-07-28', 75220.00, '{"A":"PLAN DE TRATAMIENTO , PARA ELEVADO DE MORDIDA, POR PRESENTAR TRAUMA OCLUSAL EN AMBOS MAXILARES.\r\nAUMENTO DE DIMENSION VERTICAL.\r\nSOBRE RESTAURACIONES EXISTENTES.","B":"PACIENTE REQUIERE ELEVADO DE MORDIDA, POR PRESENTAR TRAUMA OCLUSAL.\r\nPOSIBLE TRATAMIENTO CONDUCTO 26/27/37/38/47, PO SENSIBILIDAD, POSTERIOR A RETIRO DE CORONAS Y RESTAURACIONES"}', 3)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1200.00, 1.00, '16-17-14-24-27', 5, 6000.00, 0.00, 6000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 117, 1200.00, 1.00, '35-37-38-45-46-47', 6, 7200.00, 0.00, 7200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 116, 800.00, 1.00, '31-32-41-42-13-23', 6, 4800.00, 0.00, 4800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 241, 3500.00, 1.00, '16-17-26-27', 4, 14000.00, 0.00, 14000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3500.00, 1.00, '14-24', 2, 7000.00, 0.00, 7000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 197, 3500.00, 1.00, '38-37-47-35-45', 5, 17500.00, 0.00, 17500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 116, 800.00, 1.00, '31-32-41-42-13-23', 6, 4800.00, 0.00, 4800.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 117, 1200.00, 1.00, '46', 1, 1200.00, 0.00, 1200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 249, 1000.00, 1.00, '16-17-26-27-', 4, 4000.00, 0.00, 4000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 183, 1080.00, 1.00, '16-17-26-27', 4, 4320.00, 0.00, 4320.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 345, 2200.00, 1.00, NULL, 1, 2200.00, 0.00, 2200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 345, 2200.00, 1.00, NULL, 1, 2200.00, 0.00, 2200.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

    -- Paciente 3123 | Fecha: 2026-08-26 | Total: 29570.00
    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
    VALUES (3123, 1, '2026-08-26', 29570.00, '{"A":"PLAN DE TRATAMIENTO CONSERVADOR.\r\nPOSIBLE MICROCIRUGIA APICAL.","B":"PRESUPUESTO PUEDE VARIAR, SE NECESITA TOMOGRAFIA"}', 20)
    RETURNING id INTO v_id;

    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 249, 1000.00, 1.00, '37', 1, 1000.00, 0.00, 1000.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 158, 5400.00, 1.00, '37', 1, 5400.00, 0.00, 5400.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 224, 1900.00, 1.00, '37', 1, 1900.00, 0.00, 1900.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 241, 3500.00, 1.00, '37', 1, 3500.00, 0.00, 3500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'A', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 34, 1600.00, 1.00, '37', 1, 1600.00, 0.00, 1600.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 292, 8700.00, 1.00, '37', 1, 8700.00, 0.00, 8700.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 293, 2970.00, 1.00, '37', 1, 2970.00, 0.00, 2970.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 311, 4500.00, 1.00, '37', 1, 4500.00, 0.00, 4500.00, false);
    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
    VALUES (v_id, 'B', 11, 0.00, 1.00, NULL, 1, 0.00, 0.00, 0.00, false);

END $$;

-- 3. Reordenar correlativamente todas las propuestas por paciente según su fecha
--    (si el paciente tenía propuestas en Access y ya tiene en producción, las de producción se recorren al final)
WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY "pacienteId" ORDER BY fecha ASC, id ASC) as new_numero
    FROM propuestas
)
UPDATE propuestas p
SET numero = n.new_numero
FROM numbered n
WHERE p.id = n.id AND p.numero != n.new_numero;

-- 4. Sincronizar secuencias de IDs
SELECT setval('propuestas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM propuestas));
SELECT setval('propuesta_detalle_id_seq', (SELECT COALESCE(MAX(id), 1) FROM propuesta_detalle));

COMMIT;
