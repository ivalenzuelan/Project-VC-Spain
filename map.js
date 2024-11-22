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
        minZoom: 8 // Prevent zooming out too far
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

    const markers = L.markerClusterGroup({
        maxClusterRadius: 25 // Reduce the radius (default is 80)
    });

    fetch('venture_capitals.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Total VCs loaded:", data.length); // Log the total VCs
            data.forEach(vc => {
                // Destructure and provide default values for missing fields
                const {
                    Name = "Unknown",
                    Ciudad = "Unknown",
                    Direccion = "No address provided",
                    Longitud,
                    Latitud,
                    Info = "No information available",
                    Platform = "Not specified",
                    Use_Cases = "Not specified",
                    Resources = "Not specified",
                    Fondos = []
                } = vc;

                console.log(`Processing: ${Name}`); // Log each VC being processed

                // Skip if coordinates are invalid
                if (!Latitud || !Longitud || isNaN(Latitud) || isNaN(Longitud)) {
                    console.warn(`Invalid coordinates for ${Name}: (${Longitud}, ${Latitud})`);
                    return;
                }

                // Generate the "Fondos" HTML if present
                const fondosHTML = Fondos.length > 0
                    ? Fondos.map(fondo => `
                        <strong>${fondo.Nombre}</strong><br>
                        Fecha: ${fondo.Fecha}<br>
                        Tamaño: ${fondo.Tamaño}<br>
                        Enfoque: ${fondo.Enfoque}<br><br>
                    `).join('')
                    : `<em>No funds available for this VC.</em>`;

                // Popup content
                const popupContent = `
                    <strong>${Name}</strong><br>
                    <em>${Ciudad}</em><br>
                    Address: ${Direccion}<br>
                    Info: ${Info}<br>
                    Platform: ${Platform}<br>
                    Use Cases: ${Use_Cases}<br>
                    Resources: ${Resources}<br><br>
                    <button id="fondos-${Name.replace(/\s/g, '')}" style="
                        background-color: #3498db;
                        color: white;
                        border: none;
                        padding: 5px 10px;
                        border-radius: 4px;
                        cursor: pointer;
                    ">View Funds</button>
                    <div id="fondos-list-${Name.replace(/\s/g, '')}" style="display: none; margin-top: 10px;">
                        ${fondosHTML}
                    </div>
                `;

                // Create marker
                const marker = L.marker([Longitud, Latitud], { icon: customIcon }).bindPopup(popupContent);
                markers.addLayer(marker);

                // Add toggle event for "View Funds" button
                marker.on('popupopen', () => {
                    const button = document.getElementById(`fondos-${Name.replace(/\s/g, '')}`);
                    const fondosList = document.getElementById(`fondos-list-${Name.replace(/\s/g, '')}`);

                    if (button && fondosList) {
                        button.addEventListener('click', () => {
                            fondosList.style.display = fondosList.style.display === 'none' ? 'block' : 'none';
                        });
                    }
                });
            });

            map.addLayer(markers); // Add markers to the map
        })
        .catch(error => console.error('Error loading the JSON data:', error));
});