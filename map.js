document.addEventListener('DOMContentLoaded', () => {
    // All your map.js code goes here
    const map = L.map('map').setView([40.416775, -3.703790], 6); // Centered in Spain

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    const customIcon = L.divIcon({
        className: 'custom-icon',
        html: `
            <div style="
                background-color: #3498db;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
                font-size: 14px;
                font-weight: bold;
            ">VC</div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });

    const markers = L.markerClusterGroup();
    const sidebar = L.control.sidebar('sidebar', { position: 'right' }).addTo(map);
    const vcList = document.getElementById('vc-items');

    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(vc => {
                const { latitud, longitud } = vc.coordenadas;
                const { nombre, ciudad, direccion, informacion } = vc;

                const popupContent = `
                <strong>${nombre}</strong><br>
                <em>${ciudad}</em><br>
                Address: ${direccion}<br>
                Fund Size: ${informacion.tamano_fondo}<br>
                Sectors: ${informacion.sectores.join(', ')}<br>
                Key LPs: ${informacion.LPs_destacados.join(', ')}<br>
                Creation Date: ${informacion.fecha_creacion}<br>
            `;
            

                const marker = L.marker([latitud, longitud], { icon: customIcon }).bindPopup(popupContent);
                markers.addLayer(marker);

                const listItem = document.createElement('li');
                listItem.textContent = nombre;
                listItem.style.cursor = 'pointer';
                listItem.addEventListener('click', () => {
                    map.setView([latitud, longitud], 13);
                    marker.openPopup();
                });
                vcList.appendChild(listItem);
            });

            map.addLayer(markers);
        })
        .catch(error => console.error('Error loading the JSON data:', error));
});
