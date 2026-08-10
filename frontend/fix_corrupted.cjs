const fs = require('fs');

let content = fs.readFileSync('src/components/PacienteCreateView.tsx', 'utf-8');

const regex = /<input type="radio" name="forma_pago" value="Tarjeta de Crédito" checked=\{\(formData as any\)\.forma_pago === 'Tarjeta de Crédito'\} onChange=\{handleChange\} className="text-blue-600 focus:ring-blue-500 w-4 h-4" \/>\s*className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2\.5 px-8 text-lg rounded-lg flex items-center gap-2 transform hover:-translate-y-0\.5 transition-all shadow-md"\s*>/m;


const replaceStr = `<input type="radio" name="forma_pago" value="Tarjeta de Crédito" checked={(formData as any).forma_pago === 'Tarjeta de Crédito'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 uppercase">Tarjeta de Crédito</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="forma_pago" value="Cheque" checked={(formData as any).forma_pago === 'Cheque'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 uppercase">Cheque</span>
                            </label>
                        </div>
                    </div>
                </fieldset>

                <fieldset className="border border-gray-300 dark:border-gray-700 p-4 rounded-lg mt-4 bg-gray-50 dark:bg-gray-800">
                    <legend className="font-bold px-2 text-gray-700 dark:text-gray-300">Ficha Médica</legend>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-gray-300 dark:divide-gray-600">
                        
                        {/* LEFT COLUMN */}
                        <div className="flex flex-col gap-4">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-1 mb-2">
                                {[
                                    { key: 'alergia_anestesicos', label: 'ALERGIA A ANESTÉSICOS' },
                                    { key: 'alergias_drogas', label: 'ALERGIAS A DROGAS' },
                                    { key: 'hepatitis', label: 'HEPATITIS' },
                                    { key: 'asma', label: 'ASMA' },
                                    { key: 'diabetes', label: 'DIABETES' },
                                    { key: 'dolencia_cardiaca', label: 'DOLENCIA CARDÍACA' },
                                    { key: 'hipertension', label: 'HIPERTENSIÓN' },
                                    { key: 'fiebre_reumatica', label: 'FIEBRE REUMÁTICA' },
                                    { key: 'diatesis_hemorragia', label: 'DIÁTESIS HEMORRAGIA' },
                                    { key: 'sinusitis', label: 'SINUSITIS' },
                                    { key: 'ulcera_gastroduodenal', label: 'ÚLCERA GASTRODUODENAL' },
                                    { key: 'enfermedades_tiroides', label: 'ENFERMEDADES DE TIROIDES' },
                                ].map((item) => (
                                    <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" name={\`fichaMedica.\${item.key}\`} checked={(formData.fichaMedica as any)[item.key]} onChange={(e) => setFormData({ ...formData, fichaMedica: { ...formData.fichaMedica, [item.key]: e.target.checked } })} className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded border-gray-300" />
                                        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase">{item.label}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="flex gap-2 items-start">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">Observaciones :</label>
                                <textarea name="fichaMedica.observaciones" value={formData.fichaMedica.observaciones} onChange={handleChange} className="flex-1 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500" rows={2}></textarea>
                            </div>

                            <div className="flex gap-2 items-center">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">Nombre del Médico de Cabecera :</label>
                                <input type="text" name="fichaMedica.medico_cabecera" value={formData.fichaMedica.medico_cabecera} onChange={handleChange} className="flex-1 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500" />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Indique si sufre actualmente de alguna enfermedad :</label>
                                <input type="text" name="fichaMedica.enfermedad_actual" value={formData.fichaMedica.enfermedad_actual} onChange={handleChange} className="w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500" />
                            </div>

                            <div className="flex gap-4 items-center">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">¿Toma actualmente algún medicamento?</label>
                                <div className="flex gap-3">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" name="fichaMedica.toma_medicamentos" checked={formData.fichaMedica.toma_medicamentos === true} onChange={() => setFormData({ ...formData, fichaMedica: { ...formData.fichaMedica, toma_medicamentos: true } })} className="w-4 h-4" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Si</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" name="fichaMedica.toma_medicamentos" checked={formData.fichaMedica.toma_medicamentos === false} onChange={() => setFormData({ ...formData, fichaMedica: { ...formData.fichaMedica, toma_medicamentos: false } })} className="w-4 h-4" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">No</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-2 items-center">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">¿Cuál?</label>
                                <input type="text" name="fichaMedica.medicamentos_detalle" value={formData.fichaMedica.medicamentos_detalle} onChange={handleChange} className="flex-1 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500" />
                            </div>

                            <div className="flex gap-2 items-center">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">Tratamiento :</label>
                                <input type="text" name="fichaMedica.tratamiento" value={formData.fichaMedica.tratamiento} onChange={handleChange} className="flex-1 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500" />
                            </div>

                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="flex flex-col gap-5 lg:pl-8 pt-4 lg:pt-0">
                            
                            <div className="flex gap-4 justify-between items-start">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase shrink-0 max-w-[220px]">FECHA DE SU ÚLTIMA CONSULTA ODONTOLÓGICA</label>
                                <div className="flex flex-col gap-1.5 border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 rounded min-w-[160px]">
                                    {['6 meses a un año', 'mas de 1 año', 'mas de 3 año'].map((val) => (
                                        <label key={val} className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="fichaMedica.ultima_consulta" value={val} checked={formData.fichaMedica.ultima_consulta === val} onChange={handleChange} className="w-4 h-4" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{val}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 justify-between items-start">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase shrink-0 max-w-[220px]">¿CUÁNTAS VECES AL DÍA SE CEPILLA LOS DIENTES?</label>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 rounded min-w-[160px]">
                                    {['Una', 'Dos', 'Tres', 'Mas'].map((val) => (
                                        <label key={val} className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="fichaMedica.frecuencia_cepillado" value={val} checked={formData.fichaMedica.frecuencia_cepillado === val} onChange={handleChange} className="w-4 h-4" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{val}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 justify-between items-start">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase shrink-0 max-w-[220px]">¿QUÉ ELEMENTOS USA PARA SU HIGIENE DENTAL?</label>
                                <div className="flex flex-col gap-1.5 min-w-[160px]">
                                    {[
                                        { key: 'usa_cepillo', label: 'Cepillo dental' },
                                        { key: 'usa_hilo_dental', label: 'Elementos interdentales' },
                                        { key: 'usa_enjuague', label: 'Enjuague bucal' }
                                    ].map((item) => (
                                        <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={(formData.fichaMedica as any)[item.key]} onChange={(e) => setFormData({ ...formData, fichaMedica: { ...formData.fichaMedica, [item.key]: e.target.checked } })} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 justify-between items-center bg-gray-100 dark:bg-gray-700/50 p-2 rounded">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase shrink-0">¿SUFRE DE MAL ALIENTO? (HALITOSIS)</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" checked={formData.fichaMedica.mal_aliento === true} onChange={() => setFormData({ ...formData, fichaMedica: { ...formData.fichaMedica, mal_aliento: true } })} className="w-4 h-4" />
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Si</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" checked={formData.fichaMedica.mal_aliento === false} onChange={() => setFormData({ ...formData, fichaMedica: { ...formData.fichaMedica, mal_aliento: false } })} className="w-4 h-4" />
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">No</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-2 items-center">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase shrink-0">¿CONOCE LA CAUSA?</label>
                                <input type="text" name="fichaMedica.causa_mal_aliento" value={formData.fichaMedica.causa_mal_aliento} onChange={handleChange} className="flex-1 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500" />
                            </div>

                            <div className="flex gap-4 justify-between items-center bg-gray-100 dark:bg-gray-700/50 p-2 rounded">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase shrink-0">¿LE SANGRA LAS ENCÍAS AL CEPILLARSE?</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" checked={formData.fichaMedica.sangra_encias === true} onChange={() => setFormData({ ...formData, fichaMedica: { ...formData.fichaMedica, sangra_encias: true } })} className="w-4 h-4" />
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Si</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" checked={formData.fichaMedica.sangra_encias === false} onChange={() => setFormData({ ...formData, fichaMedica: { ...formData.fichaMedica, sangra_encias: false } })} className="w-4 h-4" />
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">No</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-4 justify-between items-center bg-gray-100 dark:bg-gray-700/50 p-2 rounded">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase leading-tight max-w-[260px]">¿SIENTE CANSANCIO O ALGÚN DOLOR EN LA CARA DESPUÉS DE MASTICAR O DE ALGUNA CONVERSACIÓN PROLONGADA?</label>
                                <div className="flex gap-4 shrink-0">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" checked={formData.fichaMedica.dolor_cara === true} onChange={() => setFormData({ ...formData, fichaMedica: { ...formData.fichaMedica, dolor_cara: true } })} className="w-4 h-4" />
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Si</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" checked={formData.fichaMedica.dolor_cara === false} onChange={() => setFormData({ ...formData, fichaMedica: { ...formData.fichaMedica, dolor_cara: false } })} className="w-4 h-4" />
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">No</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-2 items-center">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase shrink-0">COMENTARIOS :</label>
                                <input type="text" name="fichaMedica.comentarios" value={formData.fichaMedica.comentarios} onChange={handleChange} className="flex-1 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500" />
                            </div>

                        </div>
                    </div>
                </fieldset>

                <div className="mt-4 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSaveAndSign}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-8 text-lg rounded-lg flex items-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md"
                    >`;

content = content.replace(regex, replaceStr);
fs.writeFileSync('src/components/PacienteCreateView.tsx', content);
