document.addEventListener('DOMContentLoaded', () => {
    // Initialize the map centered on the Community of Madrid
    const map = L.map('map', {
        maxBounds: [
            [39.8, -4.5], // Southwest corner of Madrid region
            [41.2, -2.5]  // Northeast corner of Madrid region
        ],
        maxBoundsViscosity: 1.0 // Prevent dragging outside the bounds
    }).setView([40.416775, -3.703790], 10);

    // Add map tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 16,
        minZoom: 8
    }).addTo(map);

    // Define custom icons for VCs and startups
    const vcIcon = L.divIcon({
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

    const startupIcon = L.divIcon({
        className: 'startup-icon',
        html: `
            <div style="
                background-color: #e74c3c;
                width: 25px;
                height: 25px;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
                font-size: 12px;
                font-weight: bold;
            ">S</div>
        `,
        iconSize: [25, 25],
        iconAnchor: [12.5, 25],
        popupAnchor: [0, -25]
    });

    // Create separate marker cluster groups
    const vcMarkers = L.markerClusterGroup({ maxClusterRadius: 25 });
    const startupMarkers = L.markerClusterGroup({ maxClusterRadius: 25 });
    const connectionsLayer = L.layerGroup(); // Crear capa para conexiones


    // Fetch and display VCs
    fetch('venture_capitals.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(vc => {
                const { Name, Ciudad, Direccion, Longitud, Latitud, Info, Platform, Use_Cases, Resources, Fondos = [] } = vc;

                if (!Latitud || !Longitud || isNaN(Latitud) || isNaN(Longitud)) return;

                const fondosHTML = Fondos.length > 0
                    ? Fondos.map(fondo => `
                        <strong>${fondo.Nombre}</strong><br>
                        Fecha: ${fondo.Fecha}<br>
                        Tamaño: ${fondo.Tamaño}<br>
                        Enfoque: ${fondo.Enfoque}<br><br>
                    `).join('')
                    : `<em>No funds available for this VC.</em>`;

                const popupContent = `
                    <strong>${Name}</strong><br>
                    <em>${Ciudad}</em><br>
                    Address: ${Direccion}<br>
                    Info: ${Info}<br>
                    Platform: ${Platform}<br>
                    Use Cases: ${Use_Cases}<br>
                    Resources: ${Resources}<br><br>
                    <div id="fondos-list-${Name.replace(/\s/g, '')}" style="display: none; margin-top: 10px;">
                        ${fondosHTML}
                    </div>
                `;

                const marker = L.marker([Longitud, Latitud], { icon: vcIcon }).bindPopup(popupContent);
                vcMarkers.addLayer(marker);
            });

            map.addLayer(vcMarkers);
        })
        .catch(console.error);

    // Fetch and display startups
    fetch('startups.json')
    .then(response => response.json())
    .then(data => {
        data.forEach(startup => {
            const { Name, longitud, latitud, Info, Website } = startup;

            if (!longitud || !latitud || isNaN(longitud) || isNaN(latitud)) return;

            const popupContent = `
                <strong>${Name}</strong><br>
                Info: ${Info}<br>
                Website: <a href="${Website}" target="_blank">${Website}</a><br>
                <button id="show-connections-${Name.replace(/\s/g, '')}" style="
                    background-color: #3498db;
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 5px;
                    cursor: pointer;
                ">Ver Conexiones</button>
            `;

            const marker = L.marker([longitud, latitud], { icon: startupIcon }).bindPopup(popupContent);
            startupMarkers.addLayer(marker);

            marker.on('popupopen', () => {
                const button = document.getElementById(`show-connections-${Name.replace(/\s/g, '')}`);
                if (button) {
                    button.addEventListener('click', () => {
                        showConnectionsForStartup([longitud, latitud]);
                    });
                }
            });
        });

        map.addLayer(startupMarkers);
    })
    .catch(console.error);

    function showConnectionsForStartup(startupCoords) {
        connectionsLayer.clearLayers(); // Limpiar conexiones anteriores
    
        fetch('connections.json')
            .then(response => response.json())
            .then(connections => {
                connections.forEach(({ vc, startup }) => {
                    if (startup[0] === startupCoords[0] && startup[1] === startupCoords[1]) {
                        L.polyline([vc, startup], {
                            color: 'blue',
                            weight: 2,
                            dashArray: '5, 10',
                            opacity: 0.8
                        }).addTo(connectionsLayer);
                    }
                });
    
                map.addLayer(connectionsLayer);
            })
            .catch(console.error);
    }

    const toggleConnections = document.createElement('div');
toggleConnections.innerHTML = `
    <label><input type="checkbox" id="toggleConnections"> Mostrar todas las conexiones</label>
`;
filterControl.appendChild(toggleConnections);

document.getElementById('toggleConnections').addEventListener('change', (e) => {
    if (e.target.checked) {
        connectionsLayer.clearLayers();

        fetch('connections.json')
            .then(response => response.json())
            .then(connections => {
                connections.forEach(({ vc, startup }) => {
                    L.polyline([vc, startup], {
                        color: 'blue',
                        weight: 2,
                        opacity: 0.8
                    }).addTo(connectionsLayer);
                });

                map.addLayer(connectionsLayer);
            })
            .catch(console.error);
    } else {
        map.removeLayer(connectionsLayer);
    }
});

    
    // Add connections between VCs and startups
    fetch('connections.json')
    .then(response => response.json())
    .then(connections => {
        connections.forEach(({ vc, startup }) => {
            // Dibujar la línea entre VC y Startup
            L.polyline([vc, startup], {
                color: 'blue',
                weight: 1,
                opacity: 0.8
            }).addTo(map);

            // Calcular el punto intermedio
            const midPoint = [
                (vc[0] + startup[0]) / 2,
                (vc[1] + startup[1]) / 2
            ];

            // Crear un círculo en movimiento
            const movingCircle = L.circle(midPoint, {
                radius: 5,
                color: 'red',
                fillColor: 'red',
                fillOpacity: 0.9
            }).addTo(map);

            // Animar el movimiento del círculo
            let toggle = true;
            setInterval(() => {
                movingCircle.setLatLng(toggle ? vc : startup);
                toggle = !toggle;
            }, 1000); // Cambiar cada segundo
        });
    })
    .catch(console.error);


    // Add filter controls
    const filterControl = document.createElement('div');
    filterControl.innerHTML = `
        <div style="position: absolute; top: 10px; left: 10px; z-index: 1000; background: white; padding: 10px; border-radius: 5px;">
            <label><input type="checkbox" id="showVC" checked> Mostrar VCs</label><br>
            <label><input type="checkbox" id="showStartups" checked> Mostrar Startups</label>
        </div>
    `;
    document.body.appendChild(filterControl);

    document.getElementById('showVC').addEventListener('change', (e) => {
        if (e.target.checked) {
            map.addLayer(vcMarkers);
        } else {
            map.removeLayer(vcMarkers);
        }
    });

    document.getElementById('showStartups').addEventListener('change', (e) => {
        if (e.target.checked) {
            map.addLayer(startupMarkers);
        } else {
            map.removeLayer(startupMarkers);
        }
    });
});
