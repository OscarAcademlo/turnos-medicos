// ==========================================
// LÓGICA DEL WIZARD DE RESERVA (PÚBLICO)
// ==========================================

let wizardData = {
    medicoId: null,
    medicoNombre: null,
    especialidadNombre: null,
    coberturaId: null,
    coberturaNombre: null,
    planId: null,
    planNombre: null,
    fecha: null,
    hora: null
};

// Check if user is logged in to change the header button
auth.onAuthStateChanged((firebaseUser) => {
    const authSection = document.getElementById('header-auth-section');
    if (firebaseUser) {
        authSection.innerHTML = `
            <a href="dashboard.php" class="btn btn-outline-primary rounded-pill px-4 fw-semibold shadow-sm">
                <i class="bi bi-person-circle me-1"></i> Ir al Panel
            </a>
        `;
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const medicoId = urlParams.get('medico_id');
    
    if (medicoId) {
        iniciarWizardReserva(medicoId);
    } else {
        window.location.href = 'index.php'; // Volver si no hay médico
    }

    // Buscador de Coberturas
    const searchOs = document.getElementById('wizard-search-os');
    if (searchOs) {
        searchOs.addEventListener('input', function(e) {
            const term = e.target.value.toLowerCase();
            const btns = document.querySelectorAll('#wizard-os-container .os-card, #wizard-os-container .pill-btn');
            btns.forEach(btn => {
                if (btn.textContent.toLowerCase().includes(term)) {
                    btn.classList.remove('d-none');
                    btn.classList.add('d-flex'); // since os-card uses d-flex
                } else {
                    btn.classList.remove('d-flex');
                    btn.classList.add('d-none');
                }
            });
        });
    }

    // Buscador de Planes
    const searchPlan = document.getElementById('wizard-search-plan');
    if (searchPlan) {
        searchPlan.addEventListener('input', function(e) {
            const term = e.target.value.toLowerCase();
            const btns = document.querySelectorAll('#wizard-planes-container .plan-card, #wizard-planes-container .pill-btn');
            btns.forEach(btn => {
                if (btn.textContent.toLowerCase().includes(term)) {
                    btn.classList.remove('d-none');
                    btn.classList.add('d-flex');
                } else {
                    btn.classList.remove('d-flex');
                    btn.classList.add('d-none');
                }
            });
        });
    }
});

function iniciarWizardReserva(medicoId) {
    wizardData.medicoId = medicoId;
    
    // Fetch de datos del médico para llenar la barra superior
    fetch(`backend/api/get_public_agenda.php?medico_id=${medicoId}`)
        .then(res => res.json())
        .then(data => {
            if(data.length > 0) {
                const med = data[0];
                const nombreCompleto = med.nombre + ' ' + med.apellido;
                const especialidadNombre = med.especialidades && med.especialidades.length > 0 
                    ? med.especialidades.map(e => e.nombre).join(', ') 
                    : 'Medicina General';
                    
                wizardData.medico = med;
                wizardData.medicoNombre = nombreCompleto;
                wizardData.especialidadNombre = especialidadNombre;
                // Guardar el ID de la primera especialidad para el guardado del turno
                wizardData.especialidadId = med.especialidades && med.especialidades.length > 0
                    ? med.especialidades[0].especialidad_id
                    : null;
                
                document.getElementById('wizard-medico-nombre').textContent = nombreCompleto;
                document.getElementById('wizard-medico-nombre-q').textContent = nombreCompleto;
                document.getElementById('wizard-especialidad-nombre').textContent = especialidadNombre;

                const foto = med.foto_perfil || med.foto_url;
                const avatarContainer = document.getElementById('wizard-avatar-container');
                if (avatarContainer && foto && foto.trim() !== '') {
                    avatarContainer.innerHTML = `<img src="${foto}" alt="${nombreCompleto}" class="w-100 h-100 object-fit-cover">`;
                }
            } else {
                alert("Profesional no encontrado.");
                window.location.href = 'index.php';
            }
        })
        .catch(err => {
            console.error("Error cargando médico", err);
        });
}

// Global to store grouped coverage plans
let groupedObrasSociales = {};

function agruparObrasSociales(lista) {
    const knownPrefixes = [
        "Swiss Medical Group", "Swiss Medical", 
        "OSDE", "Galeno", "Sancor Salud", "Sancor", 
        "Medife", "OMINT", "O.S.D.E.", "Accord Salud", 
        "IOMA", "PAMI", "ACA Salud", "Aca Salud", "OSECAC", "Jerarquicos Salud",
        "Luis Pasteur", "Medicus", "Prevencion Salud", "Bristol Medicine"
    ];
    
    let grupos = {};
    let resultado = [];
    
    lista.forEach(os => {
        let matchedPrefix = null;
        for (let prefix of knownPrefixes) {
            if (os.nombre.toLowerCase().startsWith(prefix.toLowerCase())) {
                matchedPrefix = prefix;
                break;
            }
        }
        
        if (matchedPrefix) {
            if (!grupos[matchedPrefix]) {
                grupos[matchedPrefix] = {
                    id: 'group_' + matchedPrefix,
                    nombre: matchedPrefix,
                    isGroup: true,
                    children: []
                };
                resultado.push(grupos[matchedPrefix]);
            }
            // Add as child
            let planName = os.nombre.substring(matchedPrefix.length).trim();
            if (planName.startsWith('-')) planName = planName.substring(1).trim();
            if (planName === '') planName = 'Plan General';
            
            grupos[matchedPrefix].children.push({
                id: os.id || os.obra_social_id,
                nombre: planName,
                fullName: os.nombre
            });
        } else {
            resultado.push({
                id: os.id || os.obra_social_id,
                nombre: os.nombre,
                isGroup: false,
                children: []
            });
        }
    });
    
    // Sort
    resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return resultado;
}

// Para usar desde los botones HTML
window.wizardGoToStep2 = function() {
    document.getElementById('wizard-step-1').classList.add('d-none');
    document.getElementById('wizard-step-2').classList.remove('d-none');
    
    wizardCargarObrasSociales();
};

window.wizardCargarObrasSociales = function() {
    const container = document.getElementById('wizard-os-container');
    container.innerHTML = '<span class="text-muted">Cargando coberturas...</span>';
    
    fetch(`backend/api/get_public_agenda.php?medico_id=${wizardData.medicoId}`)
        .then(res => res.json())
        .then(data => {
            container.innerHTML = '';
            
            const renderGroupedObras = (lista, esFallback) => {
                const agrupadas = agruparObrasSociales(lista);
                groupedObrasSociales = {}; // Reset global map
                
                agrupadas.forEach(os => {
                    if (os.isGroup) {
                        groupedObrasSociales[os.id] = os.children;
                    }
                    const btn = document.createElement('button');
                    // Usar nuevo estilo visual
                    btn.className = 'os-card btn btn-light shadow-sm d-flex flex-column justify-content-center align-items-center p-3 text-center';
                    btn.style.width = '180px';
                    btn.style.height = '120px';
                    btn.style.borderRadius = '12px';
                    btn.style.border = '1px solid rgba(0,0,0,0.05)';
                    btn.style.transition = 'all 0.3s ease';
                    
                    btn.innerHTML = `<span class="fw-semibold text-primary mb-2">${os.nombre}</span>
                                     <small class="text-muted" style="font-size: 0.75rem;">
                                       ${os.isGroup ? os.children.length + ' planes' : 'Seleccionar'}
                                     </small>`;
                                     
                    btn.onmouseover = () => {
                        btn.classList.remove('btn-light');
                        btn.classList.add('btn-primary', 'text-white');
                        btn.querySelector('span').classList.remove('text-primary');
                        btn.querySelector('span').classList.add('text-white');
                        btn.querySelector('small').classList.remove('text-muted');
                        btn.querySelector('small').classList.add('text-white-50');
                        btn.style.transform = 'translateY(-3px)';
                        btn.style.boxShadow = '0 10px 20px rgba(13, 110, 253, 0.2)';
                    };
                    btn.onmouseout = () => {
                        btn.classList.add('btn-light');
                        btn.classList.remove('btn-primary', 'text-white');
                        btn.querySelector('span').classList.add('text-primary');
                        btn.querySelector('span').classList.remove('text-white');
                        btn.querySelector('small').classList.add('text-muted');
                        btn.querySelector('small').classList.remove('text-white-50');
                        btn.style.transform = 'translateY(0)';
                        btn.style.boxShadow = 'none';
                    };
                    
                    // Fix ID mapping when rendering specific items
                    const actualId = esFallback ? os.id : (os.obra_social_id || os.id);
                    btn.onclick = () => wizardSelectCobertura(actualId, os.nombre, os.isGroup);
                    container.appendChild(btn);
                });
            };

            if(!data[0].obras_sociales || data[0].obras_sociales.length === 0) {
                fetch('backend/api/crud_obras_sociales.php')
                    .then(res => res.json())
                    .then(todas => {
                        if (todas.length === 0) {
                            container.innerHTML = '<span class="text-muted">No hay obras sociales cargadas en el sistema.</span>';
                            return;
                        }
                        renderGroupedObras(todas, true);
                    });
                return;
            }
            
            renderGroupedObras(data[0].obras_sociales, false);
        })
        .catch(err => {
            console.error("Error cargando coberturas", err);
            container.innerHTML = '<span class="text-danger">Error al cargar coberturas.</span>';
        });
};

window.wizardSelectCobertura = function(id, nombre, isGroup = false) {
    wizardData.coberturaId = id;
    wizardData.coberturaNombre = nombre;
    wizardData.isGroup = isGroup;
    
    // Actualizar barra superior
    document.getElementById('wizard-cobertura-nombre').textContent = nombre;
    document.getElementById('wizard-cobertura-nombre').classList.remove('text-muted');
    document.getElementById('btn-cambiar-cobertura').classList.remove('d-none');
    
    document.getElementById('wizard-step-2').classList.add('d-none');
    
    if(id === 'particular') {
        wizardGoToStep4();
    } else {
        wizardCargarPlanes(id);
    }
};

window.wizardCargarPlanes = function(osId) {
    document.getElementById('wizard-step-3').classList.remove('d-none');
    const container = document.getElementById('wizard-planes-container');
    container.innerHTML = '<span class="text-muted">Cargando planes...</span>';
    
    // Limpiar buscador si existe
    const searchPlan = document.getElementById('wizard-search-plan');
    if(searchPlan) searchPlan.value = '';
    
    const renderPlanes = (planesArray) => {
        container.innerHTML = '';
        if(!planesArray || planesArray.length === 0) {
            document.getElementById('wizard-step-3').classList.add('d-none');
            wizardGoToStep4();
            return;
        }
        planesArray.forEach(plan => {
            const btn = document.createElement('button');
            btn.className = 'plan-card btn btn-outline-primary px-4 py-3 m-2 d-flex align-items-center justify-content-center fw-semibold';
            btn.style.borderRadius = '50px';
            btn.style.minWidth = '200px';
            btn.textContent = plan.nombre;
            btn.onclick = () => {
                wizardData.planId = plan.id;
                // Si es del grupo extraído, el nombre puede ser corto. Usamos plan.nombre
                wizardData.planNombre = plan.nombre;
                document.getElementById('wizard-cobertura-nombre').textContent = `${wizardData.coberturaNombre} - ${plan.nombre}`;
                document.getElementById('wizard-step-3').classList.add('d-none');
                wizardGoToStep4();
            };
            container.appendChild(btn);
        });
    };

    // Si osId es un grupo virtual generado por nuestro JS
    if (wizardData.isGroup && groupedObrasSociales[osId]) {
        renderPlanes(groupedObrasSociales[osId]);
        return;
    }

    // Si no es un grupo virtual, usamos la tabla real de planes_obras_sociales
    fetch(`backend/api/get_planes.php?obra_social_id=${osId}`)
        .then(res => res.json())
        .then(data => {
            renderPlanes(data);
        })
        .catch(err => {
            console.error("Error cargando planes", err);
            document.getElementById('wizard-step-3').classList.add('d-none');
            wizardGoToStep4();
        });
};

window.wizardGoToStep4 = function() {
    document.getElementById('wizard-step-4').classList.remove('d-none');
    wizardRenderCalendarioMock();
};

window.wizardRenderCalendarioMock = function() {
    const container = document.getElementById('wizard-dias-container');
    container.innerHTML = `
        <div class="col-12 text-center text-muted py-3">
            <div class="spinner-border text-primary spinner-border-sm" role="status"></div>
            <span class="ms-2">Cargando agenda...</span>
        </div>
    `;
    
    // Ocultar el título del mes antiguo porque ahora pondremos un título por cada bloque
    const mesLabel = document.getElementById('wizard-mes-label');
    if (mesLabel) mesLabel.style.display = 'none';

    fetch('backend/api/config.php')
        .then(res => res.json())
        .then(config => {
            const mesesAgenda = parseInt(config.meses_agenda) || 3;
            const diasTotales = mesesAgenda * 30; // approx
            container.innerHTML = '';
            
            const hoy = new Date();
            const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const mesNombres = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
            
            let currentMonth = -1;
            let monthContainer = null;

            for(let i=1; i<=diasTotales; i++) {
                let d = new Date(hoy);
                d.setDate(hoy.getDate() + i);
                
                if(d.getDay() === 0) continue; // Skip Sundays
                
                // Si cambiamos de mes, creamos un nuevo header y contenedor
                if (d.getMonth() !== currentMonth) {
                    currentMonth = d.getMonth();
                    
                    const header = document.createElement('h4');
                    header.className = 'w-100 text-center fw-bold mt-4 mb-3 text-secondary';
                    header.style.letterSpacing = '2px';
                    header.textContent = mesNombres[currentMonth] + (d.getFullYear() !== hoy.getFullYear() ? ' ' + d.getFullYear() : '');
                    container.appendChild(header);
                    
                    monthContainer = document.createElement('div');
                    monthContainer.className = 'd-flex flex-wrap justify-content-center w-100 mb-4';
                    container.appendChild(monthContainer);
                }
                
                let diaNombre = dias[d.getDay()];
                let diaNumero = d.getDate();
                let cupos = Math.floor(Math.random() * 10) + 1;
                
                const btn = document.createElement('button');
                btn.className = 'btn btn-outline-primary m-2 d-flex flex-column align-items-center justify-content-center shadow-sm';
                btn.style.width = '110px';
                btn.style.height = '110px';
                btn.style.borderRadius = '20px';
                btn.style.transition = 'all 0.3s ease';
                
                btn.innerHTML = `
                    <span class="text-uppercase fw-bold text-muted mb-1" style="font-size:0.8rem">${diaNombre}</span>
                    <span class="fs-2 fw-bolder mb-1">${diaNumero}</span>
                    <small class="text-muted" style="font-size:0.7rem">${cupos} turnos</small>
                `;
                
                btn.onclick = () => {
                    const yaSeleccionado = btn.classList.contains('btn-primary');
                    
                    if (yaSeleccionado) {
                        // Desmarcar al hacer clic de nuevo
                        btn.classList.remove('btn-primary', 'text-white');
                        btn.classList.add('btn-outline-primary');
                        btn.querySelectorAll('.text-muted').forEach(el => el.classList.remove('text-white-50'));
                        wizardData.fecha = null;
                        wizardData.hora = null;
                        const modalEl = document.getElementById('modalHorariosTurno');
                        const modalInstance = bootstrap.Modal.getInstance(modalEl);
                        if (modalInstance) modalInstance.hide();
                        return;
                    }

                    // Marcar este botón y desmarcar todos los demás
                    document.querySelectorAll('#wizard-dias-container .btn').forEach(b => {
                        b.classList.remove('btn-primary', 'text-white');
                        b.classList.add('btn-outline-primary');
                        b.querySelectorAll('.text-muted').forEach(el => el.classList.remove('text-white-50'));
                    });
                    btn.classList.remove('btn-outline-primary');
                    btn.classList.add('btn-primary', 'text-white');
                    btn.querySelectorAll('.text-muted').forEach(el => el.classList.add('text-white-50'));
                    
                    wizardData.fecha = d.toISOString().split('T')[0];
                    wizardAbrirModalHorarios(d);
                };
                
                monthContainer.appendChild(btn);
            }
        })
        .catch(err => {
            console.error("Error cargando configuración", err);
            container.innerHTML = '<div class="alert alert-danger w-100">Error cargando la agenda. Intente nuevamente.</div>';
        });
};

window.wizardAbrirModalHorarios = function(dateObj) {
    const list = document.getElementById('modal-horarios-list');
    const btnConfirmar = document.getElementById('wizard-btn-confirmar');
    const labelFecha = document.getElementById('modal-fecha-seleccionada');
    const sedeBanner = document.getElementById('modal-sede-info-banner');
    const infoHora = document.getElementById('modal-horario-seleccionado-info');
    const textoHora = document.getElementById('modal-hora-texto');
    
    list.innerHTML = '';
    btnConfirmar.classList.add('d-none');
    if (infoHora) infoHora.classList.add('d-none');
    wizardData.hora = null;

    const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diasClaves = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    const mesNombres = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const diaNombre = diasNombres[dateObj.getDay()];
    const diaClave = diasClaves[dateObj.getDay()];
    const diaNumero = dateObj.getDate();
    const mesNombre = mesNombres[dateObj.getMonth()];

    labelFecha.textContent = `${diaNombre} ${diaNumero} de ${mesNombre}`;

    // Buscar si el médico tiene horario cargado para este día
    const horariosDelDia = (wizardData.medico && wizardData.medico.horarios)
        ? wizardData.medico.horarios.filter(h => h.dia_semana.toLowerCase() === diaClave.toLowerCase())
        : [];

    if (horariosDelDia.length > 0) {
        const primerH = horariosDelDia[0];
        wizardData.unidadId = primerH.unidad_id || null;
        wizardData.sedeNombre = primerH.unidad_nombre || '';

        if (primerH.unidad_nombre) {
            const dir = [primerH.unidad_calle, primerH.unidad_numero].filter(Boolean).join(' ');
            sedeBanner.innerHTML = `
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill fs-6 fw-semibold">
                    <i class="bi bi-geo-alt-fill me-1"></i> ${primerH.unidad_nombre}${dir ? ' — ' + dir : ''}
                </span>
            `;
            sedeBanner.classList.remove('d-none');
        } else {
            sedeBanner.innerHTML = '';
            sedeBanner.classList.add('d-none');
        }

        // Generar slots basados en hora_inicio, hora_fin y duracion_turno_minutos
        horariosDelDia.forEach(bloque => {
            const duracion = parseInt(bloque.duracion_turno_minutos) || 30;
            const [hIni, mIni] = (bloque.hora_inicio || '08:00').split(':').map(Number);
            const [hFin, mFin] = (bloque.hora_fin || '12:00').split(':').map(Number);
            
            let cur = hIni * 60 + mIni;
            const end = hFin * 60 + mFin;
            
            while(cur < end) {
                const hr = Math.floor(cur / 60);
                const mn = cur % 60;
                const timeStr = `${String(hr).padStart(2, '0')}:${String(mn).padStart(2, '0')}`;
                
                const btn = document.createElement('button');
                btn.className = 'btn btn-outline-primary px-4 py-2 fw-bold shadow-sm rounded-pill';
                btn.textContent = timeStr + ' hs';
                btn.onclick = () => {
                    document.querySelectorAll('#modal-horarios-list .btn').forEach(b => {
                        b.classList.remove('btn-primary', 'text-white');
                        b.classList.add('btn-outline-primary');
                    });
                    btn.classList.remove('btn-outline-primary');
                    btn.classList.add('btn-primary', 'text-white');
                    wizardData.hora = timeStr;
                    wizardData.unidadId = bloque.unidad_id || null;
                    wizardData.sedeNombre = bloque.unidad_nombre || '';
                    if (infoHora && textoHora) {
                        textoHora.textContent = timeStr + ' hs';
                        infoHora.classList.remove('d-none');
                    }
                    btnConfirmar.classList.remove('d-none');
                };
                list.appendChild(btn);
                cur += duracion;
            }
        });
    } else {
        sedeBanner.innerHTML = '';
        sedeBanner.classList.add('d-none');
        wizardData.unidadId = null;
        wizardData.sedeNombre = null;

        let baseHour = 9;
        for(let i=0; i<6; i++) {
            let hr = baseHour + Math.floor(i/2);
            let min = (i%2 === 0) ? '00' : '30';
            let timeStr = `${hr.toString().padStart(2, '0')}:${min}`;
            
            const btn = document.createElement('button');
            btn.className = 'btn btn-outline-primary px-4 py-2 fw-bold shadow-sm rounded-pill';
            btn.textContent = timeStr + ' hs';
            btn.onclick = () => {
                document.querySelectorAll('#modal-horarios-list .btn').forEach(b => {
                    b.classList.remove('btn-primary', 'text-white');
                    b.classList.add('btn-outline-primary');
                });
                btn.classList.remove('btn-outline-primary');
                btn.classList.add('btn-primary', 'text-white');
                wizardData.hora = timeStr;
                if (infoHora && textoHora) {
                    textoHora.textContent = timeStr + ' hs';
                    infoHora.classList.remove('d-none');
                }
                btnConfirmar.classList.remove('d-none');
            };
            list.appendChild(btn);
        }
    }

    const modalEl = document.getElementById('modalHorariosTurno');
    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstance.show();
};

// Botones de retroceso
document.getElementById('btn-cambiar-profesional').addEventListener('click', () => {
    window.location.href = 'index.php';
});

document.getElementById('btn-cambiar-cobertura').addEventListener('click', () => {
    document.getElementById('wizard-step-4').classList.add('d-none');
    document.getElementById('wizard-step-3').classList.add('d-none');
    document.getElementById('wizard-step-2').classList.remove('d-none');
    document.getElementById('wizard-cobertura-nombre').textContent = 'Seleccionar...';
    document.getElementById('wizard-cobertura-nombre').classList.add('text-muted');
    document.getElementById('btn-cambiar-cobertura').classList.add('d-none');
});

// Confirmar Turno
document.getElementById('wizard-btn-confirmar').addEventListener('click', () => {
    const currentUser = auth.currentUser;
    
    if (currentUser) {
        // Change button state to loading
        const btn = document.getElementById('wizard-btn-confirmar');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Guardando...';
        btn.disabled = true;

        fetch('backend/api/save_turno.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                medico_id: wizardData.medicoId,
                especialidad_id: wizardData.especialidadId,
                cobertura_id: wizardData.coberturaId === 'particular' ? null : wizardData.coberturaId,
                plan_id: wizardData.planId || null,
                unidad_id: wizardData.unidadId || null,
                fecha: wizardData.fecha,
                hora: wizardData.hora
            })
        })
        .then(res => res.json())
        .then(data => {
            if(data.message && (data.message.toLowerCase().includes('error') || data.message.toLowerCase().includes('no se pudo'))) {
                alert('Error al guardar el turno: ' + data.message);
                btn.innerHTML = originalHtml;
                btn.disabled = false;
                return;
            }
            const sedeStr = wizardData.sedeNombre ? `\nSede: ${wizardData.sedeNombre}` : '';
            alert(`¡Turno reservado exitosamente!\n\nMédico: ${wizardData.medicoNombre}\nEspecialidad: ${wizardData.especialidadNombre}\nFecha: ${wizardData.fecha}\nHora: ${wizardData.hora}${sedeStr}\nCobertura: ${wizardData.coberturaNombre} ${wizardData.planNombre ? '- '+wizardData.planNombre : ''}`);
            localStorage.removeItem('turno_pendiente');
            window.location.href = 'dashboard.php';
        })
        .catch(err => {
            console.error("Error al guardar el turno", err);
            alert("Ocurrió un error al guardar tu turno. Por favor intenta de nuevo.");
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        });
    } else {
        localStorage.setItem('turno_pendiente', JSON.stringify(wizardData));
        window.location.href = 'login.php?redirect=confirmar_turno';
    }
});
