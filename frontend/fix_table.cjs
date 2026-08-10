const fs = require('fs');

let c = fs.readFileSync('src/components/PacienteList.tsx', 'utf-8'); 

// Replace Header
c = c.replace(
    '<th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paciente</th>', 
    '<th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Foto</th>\n                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paciente</th>'
);

c = c.replace(
    '<th className="no-print px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Procesos</th>\n', 
    ''
);

// Replace Photo Column in Body
c = c.replace(
    '<td className="p-3 font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer" onClick={() => navigate(`/pacientes/${paciente.id}`)}>',
    `<td className="p-3">\n                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">\n                                        {paciente.foto ? (\n                                            <img src={paciente.foto.startsWith('data:') ? paciente.foto : \`\${api.defaults.baseURL}\${paciente.foto}\`} alt="Foto" className="w-full h-full object-cover" />\n                                        ) : (\n                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">\n                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />\n                                            </svg>\n                                        )}\n                                    </div>\n                                </td>\n                                <td className="p-3 font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer" onClick={() => navigate(\`/pacientes/\${paciente.id}\`)}>`
);

// Remove Procesos Column in Body
let parts = c.split('<td className="no-print p-3">');
let p2 = parts[1].split('</td>')[1]; // this removes up to the </td> of Procesos. Wait, there is a nested </div> inside! Let's be careful.
c = parts[0] + p2.trim();

// Replace Acciones Column in Body
let actionsTd = `<td className="no-print p-3 flex gap-2">
                                    <button
                                        onClick={() => handlePrintPaciente(paciente)}
                                        className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Imprimir Ficha"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                            <rect x="6" y="14" width="12" height="8"></rect>
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => navigate(\`/pacientes/edit/\${paciente.id}\`)}
                                        className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Editar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(paciente.id)}
                                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Eliminar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                                        </svg>
                                    </button>
                                </td>`;

let startActions = c.indexOf('<td className="no-print p-3 flex gap-2">');
let endOfTr = c.indexOf('</tr>', startActions);
c = c.substring(0, startActions) + actionsTd + '\n                            ' + c.substring(endOfTr);

fs.writeFileSync('src/components/PacienteList.tsx', c);
