const style = document.createElement("style");
style.textContent = `
.modal {
    display: none;
    position: fixed;
    z-index: 9999;
    inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    overflow-y: auto;
    padding: 40px 20px;
}

.modal-content {
    background: #ffffff;
    width: 100%;
    max-width: 900px;
    margin: auto;
    border-radius: 18px;
    padding: 35px;
    animation: fadeIn .25s ease-out;
    box-shadow: 0 8px 30px rgba(0,0,0,0.25);
    border: 1px solid rgba(255,255,255,0.2);
}

.close {
    position: absolute;
    right: 35px;
    top: 25px;
    font-size: 40px;
    font-weight: bold;
    color: #d10000;
    cursor: pointer;
    transition: .2s;
}

.close:hover {
    color: #000000;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}
`;

document.head.appendChild(style);

// --------- FUNCIONES DEL MODAL -------------

function openModal(tipo) {
    const modal = document.getElementById("modalContrato");
    const body = document.getElementById("modalBody");

    let url = "";
    let cssUrl = "";

    if (tipo === "celador") {
        url = "paginas/celadores/formularioCelador.html";
        cssUrl = "paginas/celadores/formularioCelador.css";
    } else if (tipo === "sisbenNoSupervisor") {
        url = "paginas/sisbenNoSupervisor/formularioSisbenNo.html";
        cssUrl = "paginas/celadores/formularioCelador.css";
    } else if (tipo === "asedadora") {
        url = "paginas/aseadoras/formularioAseadoras.html";
        cssUrl = "paginas/celadores/formularioCelador.css
    } else {
        console.error("Tipo de contrato no reconocido:", tipo);
        return;
    }

    // Cargar el CSS dinámicamente
    cargarCSS(cssUrl);

    // Cargar el HTML externo
    fetch(url)
        .then(response => response.text())
        .then(html => {
            body.innerHTML = html;
            modal.style.display = "block";
            
            // Ejecutar scripts dentro del HTML cargado (si los hay)
            ejecutarScripts(body);
        })
        .catch(err => {
            body.innerHTML = "<p style='color:red;'>Error al cargar el contenido...</p>";
            console.error("Error:", err);
        });
}

function closeModal() {
    document.getElementById("modalContrato").style.display = "none";
}

// Función para cargar CSS dinámicamente
function cargarCSS(url) {
    // Verificar si ya existe para no duplicar
    const existente = document.querySelector(`link[href="${url}"]`);
    if (existente) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
}

// Función para ejecutar scripts dentro del HTML cargado
function ejecutarScripts(contenedor) {
    const scripts = contenedor.querySelectorAll("script");
    scripts.forEach(scriptViejo => {
        const scriptNuevo = document.createElement("script");
        if (scriptViejo.src) {
            scriptNuevo.src = scriptViejo.src;
        } else {
            scriptNuevo.textContent = scriptViejo.textContent;
        }
        scriptViejo.parentNode.replaceChild(scriptNuevo, scriptViejo);
    });
}