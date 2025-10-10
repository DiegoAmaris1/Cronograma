// Base de datos de empleados
let employees = [
    { id: '1057184649', name: 'Ana Otilia González Callico', rh: 'O+' },
    { id: '1057186823', name: 'Andrea Milena Cuervo Pacanchique', rh: 'O+' },
    { id: '1057184470', name: 'Julián Andrés Moreno González', rh: 'O+' },
    { id: '1032186823', name: 'Ana Milena Amaya Vargas', rh: 'A+' },
    { id: '1002710128', name: 'Angy Paola Rodriguez Vargas', rh: 'O+' },
    { id: '1005678123', name: 'Carlos Eduardo Pérez Silva', rh: 'B+' },
    { id: '1009876543', name: 'María José Rodríguez López', rh: 'A-' },
    { id: '1012345678', name: 'Pedro Antonio Martínez Cruz', rh: 'O+' }
];

let laborRecords = [];
let html5QrCode;
let isScanning = false;
let currentEmployee = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    loadEmployeeSelect();
    loadEmployeesTable();
    updateStats();
    updateReports();
    document.getElementById('filterDate').valueAsDate = new Date();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('startScanBtn').addEventListener('click', startScanning);
    document.getElementById('stopScanBtn').addEventListener('click', stopScanning);
    document.getElementById('manualSelectBtn').addEventListener('click', selectManualEmployee);
    document.getElementById('numDias').addEventListener('input', calculateTotal);
    document.getElementById('valorJornal').addEventListener('input', calculateTotal);
    document.getElementById('labor').addEventListener('change', toggleOtraLabor);
    document.getElementById('registerLaborBtn').addEventListener('click', registerLabor);
    document.getElementById('cancelLaborBtn').addEventListener('click', cancelLabor);
    document.getElementById('addEmployeeBtn').addEventListener('click', addEmployee);
    document.getElementById('generateAllQRBtn').addEventListener('click', generateAllQR);
    document.getElementById('printAllQRBtn').addEventListener('click', printAllQR);
    document.getElementById('filterDate').addEventListener('change', loadLaborTable);
    document.getElementById('exportBtn').addEventListener('click', exportToExcel);
    document.getElementById('printBtn').addEventListener('click', printPlanilla);
}

function updateDateTime() {
    const now = new Date();
    document.getElementById('currentDateTime').textContent = now.toLocaleString('es-CO', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(function(tab) {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-tab').forEach(function(btn) {
        btn.classList.remove('active');
    });
    document.getElementById('tab-' + tabName).classList.add('active');
    event.target.classList.add('active');
    if (tabName === 'reportes') {
        updateReports();
    }
}

function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    alertContainer.innerHTML = '<div class="alert alert-' + type + '">' + message + '</div>';
    setTimeout(function() {
        alertContainer.innerHTML = '';
    }, 5000);
}

function loadEmployeeSelect() {
    const select = document.getElementById('manualEmployee');
    select.innerHTML = '<option value="">Seleccione...</option>';
    employees.forEach(function(emp) {
        const option = document.createElement('option');
        option.value = JSON.stringify(emp);
        option.textContent = emp.id + ' - ' + emp.name;
        select.appendChild(option);
    });
}

function startScanning() {
    if (isScanning) return;
    html5QrCode = new Html5Qrcode("qr-reader");
    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        onScanSuccess,
        onScanError
    ).then(function() {
        isScanning = true;
        document.getElementById('startScanBtn').style.display = 'none';
        document.getElementById('stopScanBtn').style.display = 'inline-block';
    }).catch(function(err) {
        showAlert('Error al iniciar cámara: ' + err, 'error');
    });
}

function stopScanning() {
    if (!isScanning || !html5QrCode) return;
    html5QrCode.stop().then(function() {
        isScanning = false;
        document.getElementById('startScanBtn').style.display = 'inline-block';
        document.getElementById('stopScanBtn').style.display = 'none';
    }).catch(function(err) {
        console.error('Error:', err);
    });
}

function onScanSuccess(decodedText) {
    try {
        const data = JSON.parse(decodedText);
        if (data.id && data.name) {
            selectEmployee(data.id, data.name);
            stopScanning();
        } else {
            showAlert('QR inválido', 'error');
        }
    } catch (e) {
        showAlert('QR inválido - formato incorrecto', 'error');
    }
}

function onScanError(error) {
    // Silenciar errores continuos del escáner
}

function selectEmployee(id, name) {
    currentEmployee = { id: id, name: name };
    document.getElementById('empId').textContent = id;
    document.getElementById('empName').textContent = name;
    document.getElementById('employeeInfo').style.display = 'block';
    document.getElementById('laborForm').style.display = 'block';
    showAlert('Empleado seleccionado: ' + name, 'success');
    calculateTotal();
}

function selectManualEmployee() {
    const selected = document.getElementById('manualEmployee').value;
    if (!selected) {
        showAlert('Seleccione un empleado', 'error');
        return;
    }
    const emp = JSON.parse(selected);
    selectEmployee(emp.id, emp.name);
}

function calculateTotal() {
    const dias = parseFloat(document.getElementById('numDias').value) || 0;
    const valor = parseFloat(document.getElementById('valorJornal').value) || 0;
    document.getElementById('totalPago').textContent = (dias * valor).toLocaleString('es-CO');
}

function toggleOtraLabor() {
    const labor = document.getElementById('labor').value;
    document.getElementById('otraLaborDiv').style.display = labor === 'otra' ? 'block' : 'none';
}

function registerLabor() {
    if (!currentEmployee) {
        showAlert('No hay empleado seleccionado', 'error');
        return;
    }
    let labor = document.getElementById('labor').value;
    if (labor === 'otra') {
        labor = document.getElementById('otraLabor').value.trim();
    }
    if (!labor) {
        showAlert('Seleccione una labor', 'error');
        return;
    }
    const numDias = parseFloat(document.getElementById('numDias').value);
    const valorJornal = parseFloat(document.getElementById('valorJornal').value);
    if (!numDias || numDias <= 0) {
        showAlert('Los días deben ser mayor a 0', 'error');
        return;
    }
    if (!valorJornal || valorJornal <= 0) {
        showAlert('El valor debe ser mayor a 0', 'error');
        return;
    }
    const now = new Date();
    const record = {
        datetime: now,
        fecha: now.toLocaleDateString('es-CO'),
        hora: now.toLocaleTimeString('es-CO'),
        id: currentEmployee.id,
        nombre: currentEmployee.name,
        ciclo: document.getElementById('ciclo').value,
        labor: labor,
        numDias: numDias,
        valorJornal: valorJornal,
        totalPago: numDias * valorJornal
    };
    laborRecords.unshift(record);
    showAlert('✓ Labor registrada: ' + currentEmployee.name, 'success');
    cancelLabor();
    loadLaborTable();
    updateStats();
    updateReports();
}

function cancelLabor() {
    document.getElementById('employeeInfo').style.display = 'none';
    document.getElementById('laborForm').style.display = 'none';
    currentEmployee = null;
    document.getElementById('ciclo').value = '3';
    document.getElementById('labor').value = '';
    document.getElementById('numDias').value = '1';
    document.getElementById('valorJornal').value = '60000';
    document.getElementById('otraLabor').value = '';
    document.getElementById('otraLaborDiv').style.display = 'none';
}

function loadLaborTable() {
    const tbody = document.getElementById('laborBody');
    const filterDate = document.getElementById('filterDate').value;
    tbody.innerHTML = '';
    let filteredRecords = laborRecords;
    if (filterDate) {
        const filterDateObj = new Date(filterDate + 'T00:00:00');
        filteredRecords = laborRecords.filter(function(record) {
            return new Date(record.datetime).toDateString() === filterDateObj.toDateString();
        });
    }
    if (filteredRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">No hay registros</td></tr>';
        return;
    }
    filteredRecords.forEach(function(record) {
        const row = tbody.insertRow();
        row.innerHTML = '<td>' + record.fecha + ' ' + record.hora + '</td>' +
            '<td>' + record.id + '</td>' +
            '<td>' + record.nombre + '</td>' +
            '<td>' + record.ciclo + '</td>' +
            '<td>' + record.labor + '</td>' +
            '<td>' + record.numDias + '</td>' +
            '<td>$' + record.valorJornal.toLocaleString('es-CO') + '</td>' +
            '<td><strong>$' + record.totalPago.toLocaleString('es-CO') + '</strong></td>' +
            '<td><button class="btn btn-danger" onclick="deleteRecord(' + laborRecords.indexOf(record) + ')">✕</button></td>';
    });
}

function deleteRecord(index) {
    if (confirm('¿Eliminar este registro?')) {
        laborRecords.splice(index, 1);
        loadLaborTable();
        updateStats();
        updateReports();
        showAlert('Registro eliminado', 'success');
    }
}

function updateStats() {
    const today = new Date().toDateString();
    const todayRecords = laborRecords.filter(function(r) {
        return new Date(r.datetime).toDateString() === today;
    });
    const totalJornales = todayRecords.reduce(function(sum, r) {
        return sum + r.numDias;
    }, 0);
    const totalPago = todayRecords.reduce(function(sum, r) {
        return sum + r.totalPago;
    }, 0);
    const uniqueEmployees = new Set(todayRecords.map(function(r) {
        return r.id;
    }));
    document.getElementById('totalRegistrosHoy').textContent = todayRecords.length;
    document.getElementById('totalJornales').textContent = totalJornales.toFixed(1);
    document.getElementById('totalPagoHoy').textContent = '$' + totalPago.toLocaleString('es-CO');
    document.getElementById('empleadosHoy').textContent = uniqueEmployees.size;
}

function addEmployee() {
    const id = document.getElementById('newEmployeeId').value.trim();
    const name = document.getElementById('newEmployeeName').value.trim();
    const rh = document.getElementById('newEmployeeRH').value;
    if (!id || !name || !rh) {
        showAlert('Complete todos los campos', 'error');
        return;
    }
    if (employees.find(function(e) { return e.id === id; })) {
        showAlert('Este empleado ya existe', 'error');
        return;
    }
    employees.push({ id: id, name: name, rh: rh });
    showAlert('✓ Empleado agregado: ' + name, 'success');
    document.getElementById('newEmployeeId').value = '';
    document.getElementById('newEmployeeName').value = '';
    document.getElementById('newEmployeeRH').value = '';
    loadEmployeeSelect();
    loadEmployeesTable();
    updateReports();
}

function loadEmployeesTable() {
    const tbody = document.getElementById('employeesBody');
    tbody.innerHTML = '';
    employees.forEach(function(emp) {
        const row = tbody.insertRow();
        row.innerHTML = '<td>' + emp.id + '</td>' +
            '<td>' + emp.name + '</td>' +
            '<td>' + emp.rh + '</td>' +
            '<td><button class="btn" onclick="generateSingleQR(\'' + emp.id + '\', \'' + emp.name.replace(/'/g, "\\'") + '\')">Ver QR</button></td>';
    });
}

function generateSingleQR(id, name) {
    const qrGrid = document.getElementById('qrGrid');
    qrGrid.innerHTML = '';
    const qrCard = document.createElement('div');
    qrCard.className = 'qr-card';
    qrCard.innerHTML = '<h4>' + name + '</h4><p>ID: ' + id + '</p><div id="qr-' + id + '"></div>';
    qrGrid.appendChild(qrCard);
    setTimeout(function() {
        const qrData = JSON.stringify({ id: id, name: name });
        new QRCode(document.getElementById('qr-' + id), {
            text: qrData,
            width: 180,
            height: 180
        });
    }, 100);
    switchTab('empleados');
}

function generateAllQR() {
    const qrGrid = document.getElementById('qrGrid');
    qrGrid.innerHTML = '';
    employees.forEach(function(emp, index) {
        const qrCard = document.createElement('div');
        qrCard.className = 'qr-card';
        qrCard.innerHTML = '<h4>' + emp.name + '</h4><p>ID: ' + emp.id + '</p><div id="qr-' + emp.id + '"></div>';
        qrGrid.appendChild(qrCard);
        setTimeout(function() {
            const qrData = JSON.stringify({ id: emp.id, name: emp.name });
            new QRCode(document.getElementById('qr-' + emp.id), {
                text: qrData,
                width: 150,
                height: 150
            });
        }, 100 * (index + 1));
    });
}

function printAllQR() {
    generateAllQR();
    setTimeout(function() {
        window.print();
    }, 1000);
}

function updateReports() {
    document.getElementById('reportTotalEmpleados').textContent = employees.length;
    document.getElementById('reportTotalRegistros').textContent = laborRecords.length;
    const totalJornales = laborRecords.reduce(function(sum, r) {
        return sum + r.numDias;
    }, 0);
    const totalPagado = laborRecords.reduce(function(sum, r) {
        return sum + r.totalPago;
    }, 0);
    document.getElementById('reportTotalJornales').textContent = totalJornales.toFixed(1);
    document.getElementById('reportTotalPagado').textContent = '$' + totalPagado.toLocaleString('es-CO');
    const summary = {};
    laborRecords.forEach(function(r) {
        if (!summary[r.id]) {
            summary[r.id] = { nombre: r.nombre, jornales: 0, pago: 0 };
        }
        summary[r.id].jornales += r.numDias;
        summary[r.id].pago += r.totalPago;
    });
    const summaryBody = document.getElementById('summaryBody');
    summaryBody.innerHTML = '';
    Object.keys(summary).forEach(function(id) {
        const row = summaryBody.insertRow();
        row.innerHTML = '<td>' + id + '</td>' +
            '<td>' + summary[id].nombre + '</td>' +
            '<td>' + summary[id].jornales.toFixed(1) + '</td>' +
            '<td>$' + summary[id].pago.toLocaleString('es-CO') + '</td>';
    });
}

function exportToExcel() {
    const filterDate = document.getElementById('filterDate').value;
    let dataToExport = laborRecords;
    if (filterDate) {
        const filterDateObj = new Date(filterDate + 'T00:00:00');
        dataToExport = laborRecords.filter(function(record) {
            return new Date(record.datetime).toDateString() === filterDateObj.toDateString();
        });
    }
    const exportData = dataToExport.map(function(r) {
        return {
            'Fecha': r.fecha,
            'Hora': r.hora,
            'ID': r.id,
            'Nombre': r.nombre,
            'Ciclo': r.ciclo,
            'Labor': r.labor,
            'Días': r.numDias,
            'Valor Jornal': r.valorJornal,
            'Total': r.totalPago
        };
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Jornales');
    const fileName = 'Jornales_' + (filterDate || new Date().toISOString().split('T')[0]) + '.xlsx';
    XLSX.writeFile(wb, fileName);
    showAlert('✓ Excel exportado', 'success');
}

function printPlanilla() {
    const filterDate = document.getElementById('filterDate').value;
    const printDate = filterDate || new Date().toISOString().split('T')[0];
    document.getElementById('printDate').textContent = new Date(printDate + 'T00:00:00').toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    let dataToExport = laborRecords;
    if (filterDate) {
        const filterDateObj = new Date(filterDate + 'T00:00:00');
        dataToExport = laborRecords.filter(function(record) {
            return new Date(record.datetime).toDateString() === filterDateObj.toDateString();
        });
    }
    const printTableBody = document.getElementById('printTableBody');
    printTableBody.innerHTML = '';
    let totalJornales = 0;
    let totalPagar = 0;
    dataToExport.forEach(function(record) {
        const row = printTableBody.insertRow();
        row.innerHTML = '<td style="border: 1px solid #000; padding: 6px;">' + record.fecha + '</td>' +
            '<td style="border: 1px solid #000; padding: 6px;">' + record.id + '</td>' +
            '<td style="border: 1px solid #000; padding: 6px;">' + record.nombre + '</td>' +
            '<td style="border: 1px solid #000; padding: 6px; text-align: center;">' + record.ciclo + '</td>' +
            '<td style="border: 1px solid #000; padding: 6px;">' + record.labor + '</td>' +
            '<td style="border: 1px solid #000; padding: 6px; text-align: center;">' + record.numDias + '</td>' +
            '<td style="border: 1px solid #000; padding: 6px; text-align: right;">$' + record.valorJornal.toLocaleString('es-CO') + '</td>' +
            '<td style="border: 1px solid #000; padding: 6px; text-align: right;"><strong>$' + record.totalPago.toLocaleString('es-CO') + '</strong></td>' +
            '<td style="border: 1px solid #000; padding: 6px; height: 50px;">&nbsp;</td>';
        totalJornales += record.numDias;
        totalPagar += record.totalPago;
    });
    const totalRow = printTableBody.insertRow();
    totalRow.innerHTML = '<td colspan="5" style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">TOTALES:</td>' +
        '<td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">' + totalJornales.toFixed(1) + '</td>' +
        '<td style="border: 1px solid #000; padding: 8px;"></td>' +
        '<td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold; background: #f0f0f0;">$' + totalPagar.toLocaleString('es-CO') + '</td>' +
        '<td style="border: 1px solid #000; padding: 8px;"></td>';
    setTimeout(function() {
        window.print();
    }, 100);
}
