-- =========================================================
-- MIGRACION DE TRABAJOS OBSERVADOS / TRASPASADOS A PRODUCCION
-- =========================================================

-- 1. Agregar columnas si no existen
ALTER TABLE trabajos_laboratorios
  ADD COLUMN IF NOT EXISTS traspasado VARCHAR(10) DEFAULT 'no',
  ADD COLUMN IF NOT EXISTS observacion_traspaso TEXT;

-- 2. Actualizar los 47 registros observados de Access
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'SE COMPRO LOS ATACH, LABORATORIO NO COBRA' WHERE access_id = 'T-1117';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'NO SE PAGA PORQUE SE HIZO INMEDIATAMENTE DE GRADIA' WHERE access_id = 'T-1179';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'DR. DEBE HABLAR CON JESUS' WHERE access_id = 'T-1268';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'CREO QUE NO SE PAGA REVISAR' WHERE access_id = 'T-1497';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'LABORATORIO NO COBRARA FALLA DE TECNICO' WHERE access_id = 'T-1540';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'NO SE PAGA PORQUE NO ERA PLACA??' WHERE access_id = 'T-1570';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'CREO QUE NO SE PAGA REVISAR' WHERE access_id = 'T-1579';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'NO SE PAGA' WHERE access_id = 'T-1678';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'ESTE TRABAJO YA FUE PAGADO COMO PIEZA 44, SIENDO CORRECTA 25' WHERE access_id = 'T-1700';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'NO SE PAGA PORQUE ESTABA DENTRO EL PLAZO DE GARANTIA' WHERE access_id = 'T-1896';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'REVISAR CON DOCTOR TRABAJO RECIENTE CON DR. RUIZ' WHERE access_id = 'T-1897';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'SE CANCELO EL CAMBIO DE CLIP BS.60' WHERE access_id = 'T-1899';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'NO SE PAGA PORQUE EL TRABAJO SE REALIZO A FINES DEL AÑO 2016' WHERE access_id = 'T-1912';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'NO ESTA REGISTRADO EN LAB ROBERTO PARECE QUE HAY ERROR' WHERE access_id = 'T-2053';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'TRABAJO YA PAGADO ES REPARACION' WHERE access_id = 'T-2112';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'ESTE TRABAJO NO SE PAGA ES REPETICION' WHERE access_id = 'T-2191';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'ESTE TRBAJO NO SE PAGA ES REPETICION' WHERE access_id = 'T-2192';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'ESTE TRABAJO ES PAGADO  EN LAB#2133  ESTA CON EL NOMBRE DE CAROLINA ISENSEE' WHERE access_id = 'T-2232';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'TRABAJO YA CANCELADO' WHERE access_id = 'T-2276';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'NO SE PAGARA PORQUE SOLO AUMENTARONPORCELANAN POR UN LADO' WHERE access_id = 'T-2340';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'NO SE PAGA ESTE TRABAJO' WHERE access_id = 'T-2346';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'NO SE PAGA PORQUE TRABAJO FUE REALIZADO RECIENTEMENTE' WHERE access_id = 'T-2368';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'ESTE TRABAJO PAGA EL DR. ANTEQUERA ES SU PACIENTE' WHERE access_id = 'T-2407';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'TRABAJO SE REPITIO  POCO TIEMPO EN BOCA DE PACIENTE' WHERE access_id = 'T-2421';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'NO SE PAGA' WHERE access_id = 'T-2470';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'TRABAJO REPETIDO NO SE PAGA' WHERE access_id = 'T-2494';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'NO SE PAGA' WHERE access_id = 'T-2522';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'TRABAJO REPETIDO' WHERE access_id = 'T-2530';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'TRABAJO MODIFICADO YA SE PAGO' WHERE access_id = 'T-2677';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'NO SE PAGA, TRABAJO REALIZADO POR MARTIN, SE FRACTURO. FUE REPARADA LA PLACA' WHERE access_id = 'T-2802';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'NO SE PAGA ES TRABAJO RECIENTE' WHERE access_id = 'T-3055';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'TRABAJO YA FUE PAGADO, ESTA INFORMACION SIRVE PARA EFECTOS PAGO DR. ANTEQUERA' WHERE access_id = 'T-3158';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'ESTE TRABAJO YA FUE PAGADO, ESTA INFORMACION SIRVE PARA EFECTOS DE PAGO ADR. ANTEQUERA' WHERE access_id = 'T-3159';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'NO SE PAGA PORQUE HIZO RECIEN EL TRABAJO' WHERE access_id = 'T-3182';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'NO SE PAGA, TRABAJO FUE PAGADO COMO PROVISIONAL SOBRE IMPLANTE POR EQUIVOCACION¿¡¡¡¡¡' WHERE access_id = 'T-408';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'SE REPARA PROTESIS REALIZADA  EL 17 DE DICIEMBRE 2025' WHERE access_id = 'T-4252';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'TRABAJO REPETIDO, SE MANDO NOTA A LAB.' WHERE access_id = 'T-441';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'NO SE PAGA ESTE TRABAJO PORQUE LA CERAMICA VOLVIO A SALTAR' WHERE access_id = 'T-535';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'NO SE PAGA TRABAJO REPETIDO' WHERE access_id = 'T-665';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'CORROBORAR CON GALINDO' WHERE access_id = 'T-684';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'CORROBORAR CON GALINDO' WHERE access_id = 'T-685';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'CANCELADO PERSONALMENTE A LABORATORIO CON DESCUENTO' WHERE access_id = 'T-783';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'TRABAJO REPETIDO NO SE PAGA' WHERE access_id = 'T-849';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'NO SE PAGA TRABAJOS PORQUE SE VOLVIO A REALIZAR 2 VECES LO MISMO' WHERE access_id = 'T-850';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'ESTE TRABAJO NO SEPAGA POR ERROR DE LAB. GALINDO' WHERE access_id = 'T-887';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'TRABAJO SE PAGO ANTERIORMENTE DR. ARTIEDA OBSERVA, MISMO ARREGLO' WHERE access_id = 'T-936';
UPDATE trabajos_laboratorios SET traspasado = 'si', observacion_traspaso = 'TRABAJO PAGADO ELIMINAR DE SISTEMA' WHERE access_id = 'T-952';
