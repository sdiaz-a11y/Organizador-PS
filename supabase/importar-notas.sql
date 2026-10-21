-- Importa las notas del proyecto al tablero. Ejecutar una sola vez en Supabase > SQL Editor.
-- Las tarjetas quedan sin responsable; asígnalas desde el tablero.

insert into public.tareas (titulo, descripcion, estado, prioridad, tipo, orden)
select titulo, descripcion, estado, prioridad, tipo, extract(epoch from now()) * 1000 + n
from (values
  -- ===================== HECHO =====================
  (1, 'Conectar con Drive y leer las hojas con IA', 'hecho', 'alta', 'mejora',
   $$- Conectar la herramienta a Drive.
- Que lea las hojas de registro.
- Investigar cuáles son las mejores IAs para hacerlo.$$),

  (2, 'LADA, teléfono y link de WhatsApp', 'hecho', 'media', 'mejora',
   $$- LADA (en chiquito en la web): seleccionar región MX o USA; MX = +52, USA = +1.
- Teléfono: se pone +52 o +1 por defecto en el número.
- Link WA: se arma como wa.me/teléfono.$$),

  (3, 'Vista modo voucher y tipo de membresía', 'hecho', 'media', 'mejora',
   $$- Vista modo voucher.
- Si trae voucher, el pago por defecto es tarjeta, y el voucher se lee para obtener la cantidad del total.
- Tipo de membresía: si se cumplen los parámetros, se compara lo señalado abajo de la hoja contra el precio de la hoja y el pago para confirmar.
- Precios (se anotan en notas que son a meses): $11,396.58 = 3 meses, $14,816.58 = 6 meses, $18,448.92 = 12 meses.
- Recortar el campo "Cantidad pagada" para que al lado quepa "Tipo de membresía" con opciones 3, 6 y 12 meses.$$),

  (4, 'Validaciones del formulario y de las imágenes', 'hecho', 'alta', 'mejora',
   $$- No dejar continuar si no está todo lleno; recuadro de notas opcional.
- Si no aplica, bloquear el campo #tarjeta.
- Si NO es una foto de las hojas de registro, no permitir que se guarde de ninguna manera.
- En las imágenes que no califiquen, agregar botón siguiente / terminar escaneo sin guardar esa imagen, como si fuera una imagen válida.$$),

  (5, 'Carga de fotos desde Drive y desde la computadora', 'hecho', 'alta', 'mejora',
   $$- Pedir un link de Drive y descargar las fotos. La carpeta del registro tiene 3 carpetas: completos, apartados e interesados.
- Si es un PDF, mostrar el archivo en pantalla con scroll.
- Confirmación al dar click a la carpeta de Drive (antes la usaba de inmediato) y al subir fotos desde local.
- Botón para quitar fotos del escaneo.
- Al arrastrar fotos desde local, aparecía unos segundos "Agregar las hojas de este escaneo" con "Elegir fotos o PDF" y "Cancelar escaneo", cosa que no pasa al abrir el explorador o agregar desde Drive: unificar el comportamiento.
- Animación al buscar imágenes en Drive.$$),

  (6, 'Reabrir, editar, autoguardado y descarga final', 'hecho', 'alta', 'mejora',
   $$- Poder abrir de nuevo un registro y modificar/actualizar los datos.
- Poder reabrir drives también.
- Autoguardado con animación que indique que se está guardando.
- Al final, descargar los datos en el Drive y en local.
- Respaldos optimizados: que gasten menos espacio o con borrado programado.$$),

  (7, 'Correcciones: avisos, atajo, papelera y duplicados', 'hecho', 'alta', 'bug',
   $$- Quitar los avisos y ponerlos hasta abajo.
- El atajo no funcionaba.
- Si el drive está en papelera, igual funcionaba: no debe contar.
- Duplicados: uno en papelera se seguía marcando como duplicado, y "Ver en Drive" abría el drive con aviso de papelera. También salía duplicada con el respaldo borrado.
- Mientras se sube, bloquear TODOS los botones (se quedaba activo "Revisar hojas").$$),

  (8, 'Diseño del CRM, indicadores de carga y responsive', 'hecho', 'media', 'mejora',
   $$- Asimilar el diseño del CRM como si estuviera implementado, sin la barra lateral, sin mover funcionalidad (siguen siendo dos cosas aparte).
- Barras de carga o señal animada cuando esté cargando.
- Responsive: en resoluciones pequeñas se veían cosas muy grandes y otras muy pequeñas.
- Zoom de la hoja: en distintas resoluciones se veía lejos, casi la vista completa. Corregir.$$),

  (9, 'Detalles de la interfaz de selección de carpeta', 'hecho', 'baja', 'bug',
   $$- "Usar otra carpeta" debe quitar el link que se usó (lo dejaba).
- Recortar el link de "Abrir en Drive": se podía seleccionar más allá de su letrero.
- Selección única: si seleccionas "Completos" en "Subir desde mi computadora" y luego eliges subir desde Drive, el primero debe deseleccionarse; solo uno a la vez.$$),

  -- ===================== IDEAS (por implementar con el CRM) =====================
  (10, 'Eventos en el CRM con completos, apartados e interesados', 'idea', 'alta', 'idea',
   $$Una vez integrado en el CRM:
- Eventos (por ejemplo "GDL"), y dentro de cada uno poder escanear las hojas y asociar los datos al evento (completos, apartados, interesados).
- Recordar la autorización del CRM.$$),

  (11, 'Trabajo simultáneo de dos usuarios sobre los mismos registros', 'idea', 'alta', 'idea',
   $$Dos usuarios a los que se asignó el mismo grupo de registros (completos, por ejemplo) trabajan a la par: uno de la primera a la última hoja y otro de la última a la primera, hasta terminar todas.
Conviene bloquear las hojas que está analizando la otra persona para evitar errores o dobles registros.$$),

  (12, 'Admin: descargar datos del evento y marcarlo como terminado', 'idea', 'media', 'idea',
   $$Un admin entra al evento y descarga los datos en el Drive (el mismo de las fotos) y de forma local. Que se vea que el evento ya está terminado.$$),

  (13, 'Conectar con el CRM y mandar invitaciones', 'idea', 'media', 'idea',
   $$Conectar con el CRM y mandar invitaciones.$$),

  (14, 'Campo "Abeja" con el vendedor desde Axis', 'idea', 'baja', 'idea',
   $$Ver si mediante el endpoint de Axis se puede poner el vendedor en el campo "Abeja" del cuadro de texto. Siempre opcional y siempre sacado de Axis. Solo en el CRM; en el Excel no se guardaría nada.$$)
) as t(n, titulo, estado, prioridad, tipo, descripcion);
