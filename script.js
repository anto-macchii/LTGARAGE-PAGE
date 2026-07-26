// script.js
// Este archivo SOLO se encarga de animaciones. No toca imágenes ni contenido.
//
// La idea: las secciones (servicios, galería, zona, contacto) empiezan
// un poco invisibles y desplazadas hacia abajo, y aparecen suavemente
// cuando el usuario hace scroll y llegan a la pantalla.

document.addEventListener("DOMContentLoaded", () => {

  // Elegimos las secciones que van a animarse
  const secciones = document.querySelectorAll(".servicios, .galeria, .zona, .contacto");

  // "IntersectionObserver" es una herramienta del navegador que avisa
  // cuando un elemento entra o sale de la pantalla (sin tener que calcular
  // scroll a mano). Le decimos qué hacer cuando eso pasa:
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        // el elemento entró en pantalla -> le agregamos la clase que lo muestra
        entrada.target.classList.add("aparecer");
        // ya no hace falta seguir observándolo
        observador.unobserve(entrada.target);
      }
    });
  }, {
    threshold: 0.15 // se activa cuando se ve un 15% de la sección
  });

  // Antes de observarlas, les agregamos la clase inicial (invisibles/desplazadas)
  secciones.forEach((seccion) => {
    seccion.classList.add("pre-animacion");
    observador.observe(seccion);
  });


  const mapaEl = document.getElementById('mapa');
  const loadScript = (src) => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve(script);
    script.onerror = reject;
    document.body.appendChild(script);
  });

  const initLeaflet = async () => {
    if (typeof L === 'undefined') {
      await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
    }
    if (!mapaEl || typeof L === 'undefined') return;

    const map = L.map('mapa').setView([-38.0150, -57.5330], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
    }).addTo(map);
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const areaColor = '#7fd4e8';
    const fillOpacity = 0.22;

    const playaGrandeCoords = [
      [-38.0028, -57.5398],
      [-38.0028, -57.5252],
      [-38.0138, -57.5252],
      [-38.0138, -57.5398]
    ];

    const stellaMarisCoords = [
      [-38.0088, -57.5248],
      [-38.0088, -57.5162],
      [-38.0188, -57.5162],
      [-38.0188, -57.5248]
    ];

    const losTroncosCoords = [
      [-38.0115, -57.5360],
      [-38.0115, -57.5228],
      [-38.0215, -57.5228],
      [-38.0215, -57.5360]
    ];

    const playaGrande = L.polygon(playaGrandeCoords, { color: areaColor, fillOpacity: fillOpacity }).bindPopup('Playa Grande');
    const stellaMaris = L.polygon(stellaMarisCoords, { color: areaColor, fillOpacity: fillOpacity }).bindPopup('Stella Maris');
    const losTroncos = L.polygon(losTroncosCoords, { color: areaColor, fillOpacity: fillOpacity }).bindPopup('Los Troncos');

    const areaLayers = {
      'Playa Grande': playaGrande,
      'Stella Maris': stellaMaris,
      'Los Troncos': losTroncos
    };

    drawnItems.addLayer(playaGrande);
    drawnItems.addLayer(stellaMaris);
    drawnItems.addLayer(losTroncos);

    const clearBtn = document.getElementById('clear-area');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        drawnItems.clearLayers();
        for (const k of Object.keys(areaLayers)) delete areaLayers[k];
        map.closePopup();
      });
    }

    const mergeAreaLayers = () => {
      const layers = Object.values(areaLayers).filter(Boolean);
      if (layers.length === 0) return;
      let merged = layers[0].toGeoJSON();
      for (let i = 1; i < layers.length; i++) {
        try {
          merged = turf.union(merged, layers[i].toGeoJSON());
        } catch (err) {
          console.error('Error uniendo polígonos con Turf:', err);
          return;
        }
      }
      layers.forEach(l => drawnItems.removeLayer(l));
      const mergedLayer = L.geoJSON(merged, { color: areaColor, weight: 2, fillOpacity: 0 }).bindPopup('Área conjunta');
      drawnItems.addLayer(mergedLayer);
      for (const k of Object.keys(areaLayers)) delete areaLayers[k];
      areaLayers['Conjunto'] = mergedLayer;
    };

    const loadTurf = () => {
      return new Promise((resolve, reject) => {
        if (window.turf) return resolve(window.turf);
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js';
        script.defer = true;
        script.onload = () => resolve(window.turf);
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const mergeBtn = document.getElementById('merge-areas');
    if (mergeBtn) {
      mergeBtn.addEventListener('click', async () => {
        mergeBtn.disabled = true;
        mergeBtn.textContent = 'Uniendo...';
        try {
          await loadTurf();
          mergeAreaLayers();
        } catch (err) {
          console.error('No se pudo cargar Turf para unir áreas:', err);
        } finally {
          mergeBtn.disabled = false;
          mergeBtn.textContent = 'Unir áreas';
        }
      });
    }

    const adjustBtn = document.getElementById('adjust-streets');
    if (adjustBtn) {
      adjustBtn.addEventListener('click', async () => {
        adjustBtn.disabled = true;
        adjustBtn.textContent = 'Ajustando...';
        const queries = {
          'Playa Grande': 'Playa Grande, Mar del Plata, Argentina',
          'Stella Maris': 'Stella Maris, Mar del Plata, Argentina',
          'Los Troncos': 'Los Troncos, Mar del Plata, Argentina'
        };

        for (const name of Object.keys(queries)) {
          try {
            const q = encodeURIComponent(queries[name]);
            const url = `https://nominatim.openstreetmap.org/search?format=json&polygon_geojson=1&limit=1&q=${q}`;
            const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0 && data[0].geojson) {
              if (areaLayers[name]) {
                drawnItems.removeLayer(areaLayers[name]);
              }
              const geo = data[0].geojson;
              const layer = L.geoJSON(geo, { style: { color: areaColor, fillOpacity: fillOpacity } }).bindPopup(name);
              drawnItems.addLayer(layer);
              areaLayers[name] = layer;
            } else {
              console.warn('No se encontró polígono para', name);
            }
          } catch (err) {
            console.error('Error consultando Nominatim para', name, err);
          }
        }

        adjustBtn.disabled = false;
        adjustBtn.textContent = 'Ajustar por calles';
      });
      setTimeout(() => {
        if (!adjustBtn.disabled) adjustBtn.click();
      }, 700);
    }
  };

  if (mapaEl) {
    const mapObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          initLeaflet();
          observer.disconnect();
        }
      });
    }, { threshold: 0.2 });
    mapObserver.observe(mapaEl);
  }

});
