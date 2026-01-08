import { useState, useEffect, useMemo } from 'react';
import { 
  Search, ChevronDown, ChevronRight, Save, RotateCcw, 
  Download, Upload, Trash2, RefreshCw, Languages, Check, X,
  AlertCircle, CheckCircle, Info
} from 'lucide-react';
import { translationsService } from '../../services/translationsService';
import { useToast } from '../ui/Toast';
import { translations, Language } from '../../i18n/translations';
import { useLanguage } from '../../i18n';

interface CmsTranslationsTabProps {
  t: any;
  cmsSelectedSection: string;
  setCmsSelectedSection: (section: string) => void;
  cmsSearchQuery: string;
  setCmsSearchQuery: (query: string) => void;
  cmsEditingKey: string | null;
  setCmsEditingKey: (key: string | null) => void;
  cmsEditValues: { de: string; en: string };
  setCmsEditValues: (values: { de: string; en: string }) => void;
  cmsLoading: boolean;
  setCmsLoading: (loading: boolean) => void;
  cmsExpandedSections: Set<string>;
  setCmsExpandedSections: (sections: Set<string>) => void;
}

interface FlatTranslation {
  fullKey: string;
  section: string;
  key: string;
  deValue: string;
  enValue: string;
  isCustom: boolean;
}

export function CmsTranslationsTab({
  t,
  cmsSelectedSection,
  setCmsSelectedSection,
  cmsSearchQuery,
  setCmsSearchQuery,
  cmsEditingKey,
  setCmsEditingKey,
  cmsEditValues,
  setCmsEditValues,
  cmsLoading,
  setCmsLoading,
  cmsExpandedSections,
  setCmsExpandedSections,
}: CmsTranslationsTabProps) {
  const { reloadTranslations } = useLanguage();
  const toast = useToast();
  const [customEntries, setCustomEntries] = useState<Map<string, string>>(new Map());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showResetConfirm, setShowResetConfirm] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  // Get all sections
  const sections = useMemo(() => translationsService.getSections(), []);

  // Load custom entries on mount
  useEffect(() => {
    loadCustomEntries();
  }, []);

  const loadCustomEntries = async () => {
    setCmsLoading(true);
    try {
      const entries = await translationsService.getAllCustomTranslations();
      const map = new Map<string, string>();
      entries.forEach(entry => {
        map.set(entry.id, entry.value);
      });
      setCustomEntries(map);
    } catch (error) {
      console.error('Failed to load custom translations:', error);
    } finally {
      setCmsLoading(false);
    }
  };

  // Flatten translations for display
  const flattenObject = (obj: any, prefix = ''): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const key in obj) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(result, flattenObject(obj[key], newKey));
      } else {
        result[newKey] = String(obj[key]);
      }
    }
    return result;
  };

  // Get all translations as flat list
  const allTranslations = useMemo((): FlatTranslation[] => {
    const deFlat = flattenObject(translations.de);
    const enFlat = flattenObject(translations.en);
    
    const result: FlatTranslation[] = [];
    
    for (const fullKey of Object.keys(deFlat)) {
      const parts = fullKey.split('.');
      const section = parts[0];
      const key = parts.slice(1).join('.');
      
      if (!key) continue;
      
      const deCustomKey = `de:${fullKey}`;
      const enCustomKey = `en:${fullKey}`;
      
      result.push({
        fullKey,
        section,
        key,
        deValue: customEntries.get(deCustomKey) || deFlat[fullKey] || '',
        enValue: customEntries.get(enCustomKey) || enFlat[fullKey] || '',
        isCustom: customEntries.has(deCustomKey) || customEntries.has(enCustomKey),
      });
    }
    
    return result;
  }, [customEntries]);

  // Filter translations
  const filteredTranslations = useMemo(() => {
    let filtered = allTranslations;
    
    if (cmsSelectedSection) {
      filtered = filtered.filter(t => t.section === cmsSelectedSection);
    }
    
    if (cmsSearchQuery) {
      const query = cmsSearchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.fullKey.toLowerCase().includes(query) ||
        t.deValue.toLowerCase().includes(query) ||
        t.enValue.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [allTranslations, cmsSelectedSection, cmsSearchQuery]);

  // Group by section
  const groupedTranslations = useMemo(() => {
    const groups: Record<string, FlatTranslation[]> = {};
    for (const t of filteredTranslations) {
      if (!groups[t.section]) {
        groups[t.section] = [];
      }
      groups[t.section].push(t);
    }
    return groups;
  }, [filteredTranslations]);

  // Toggle section expansion
  const toggleSection = (section: string) => {
    const newExpanded = new Set(cmsExpandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setCmsExpandedSections(newExpanded);
  };

  // Start editing a translation
  const startEditing = (item: FlatTranslation) => {
    setCmsEditingKey(item.fullKey);
    setCmsEditValues({ de: item.deValue, en: item.enValue });
  };

  // Save edited translation
  const saveTranslation = async () => {
    if (!cmsEditingKey) return;
    
    setSaveStatus('saving');
    try {
      const parts = cmsEditingKey.split('.');
      const section = parts[0];
      const key = parts.slice(1).join('.');
      
      // Save both DE and EN
      await translationsService.saveTranslation('de', section, key, cmsEditValues.de);
      await translationsService.saveTranslation('en', section, key, cmsEditValues.en);
      
      // Update local state
      const newCustom = new Map(customEntries);
      newCustom.set(`de:${cmsEditingKey}`, cmsEditValues.de);
      newCustom.set(`en:${cmsEditingKey}`, cmsEditValues.en);
      setCustomEntries(newCustom);
      
      // Reload translations in app
      await reloadTranslations();
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      setCmsEditingKey(null);
    } catch (error) {
      console.error('Failed to save translation:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Reset to default
  const resetToDefault = async (item: FlatTranslation) => {
    try {
      const parts = item.fullKey.split('.');
      const section = parts[0];
      const key = parts.slice(1).join('.');
      
      await translationsService.deleteTranslation('de', section, key);
      await translationsService.deleteTranslation('en', section, key);
      
      const newCustom = new Map(customEntries);
      newCustom.delete(`de:${item.fullKey}`);
      newCustom.delete(`en:${item.fullKey}`);
      setCustomEntries(newCustom);
      
      await reloadTranslations();
      toast.success('Übersetzung zurückgesetzt', `"${item.key}" wurde auf den Standardwert zurückgesetzt.`);
      setShowResetConfirm(null);
    } catch (error) {
      console.error('Failed to reset translation:', error);
      toast.error('Fehler', 'Zurücksetzung fehlgeschlagen');
    }
  };

  // Export translations
  const handleExport = async () => {
    const data = await translationsService.exportTranslations();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translations_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import translations
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const content = await file.text();
      const result = await translationsService.importTranslations(content);
      if (result.success) {
        toast.success('Import erfolgreich', `${result.count} Übersetzungen wurden importiert.`);
        await loadCustomEntries();
        await reloadTranslations();
      } else {
        toast.error('Import fehlgeschlagen', result.error || 'Unbekannter Fehler');
      }
    } catch (error) {
      toast.error('Import fehlgeschlagen', 'Die Datei konnte nicht verarbeitet werden.');
    }
    event.target.value = '';
  };

  // Clear all custom translations
  const handleClearAll = async () => {
    await translationsService.clearAllCustom();
    setCustomEntries(new Map());
    await reloadTranslations();
    toast.success('Zurückgesetzt', 'Alle benutzerdefinierten Übersetzungen wurden gelöscht.');
    setShowClearAllConfirm(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 style={{ fontWeight: 'var(--font-weight-medium)' }}>
          <Languages size={18} className="inline mr-2" />
          CMS - Textpflege
        </h3>
        <div className="flex gap-2">
          <button
            onClick={loadCustomEntries}
            className="px-3 py-1 rounded flex items-center gap-1 text-sm"
            style={{ border: '1px solid var(--border-default)' }}
            disabled={cmsLoading}
          >
            <RefreshCw size={14} className={cmsLoading ? 'animate-spin' : ''} />
            Aktualisieren
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1 rounded flex items-center gap-1 text-sm"
            style={{ border: '1px solid var(--border-default)' }}
          >
            <Download size={14} />
            Exportieren
          </button>
          <label className="px-3 py-1 rounded flex items-center gap-1 text-sm cursor-pointer" style={{ border: '1px solid var(--border-default)' }}>
            <Upload size={14} />
            Importieren
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          {showClearAllConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: 'var(--status-danger)' }}>Wirklich alle löschen?</span>
              <button
                onClick={handleClearAll}
                className="px-2 py-1 rounded text-xs"
                style={{ background: 'var(--status-danger)', color: 'white' }}
              >
                Ja
              </button>
              <button
                onClick={() => setShowClearAllConfirm(false)}
                className="px-2 py-1 rounded text-xs"
                style={{ border: '1px solid var(--border-default)' }}
              >
                Nein
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClearAllConfirm(true)}
              className="px-3 py-1 rounded flex items-center gap-1 text-sm"
              style={{ border: '1px solid var(--border-default)', color: 'var(--status-danger)' }}
            >
              <Trash2 size={14} />
              Alle zurücksetzen
            </button>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--status-info)', opacity: 0.9 }}>
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5" style={{ color: 'var(--text-primary)' }} />
          <div style={{ fontSize: 'var(--font-size-sm)' }}>
            <strong>Hinweis:</strong> Hier können Sie alle statischen Texte der Anwendung bearbeiten. 
            Änderungen werden in der lokalen Datenbank gespeichert und überschreiben die Standardwerte. 
            Falls die Datenbank nicht erreichbar ist, werden automatisch die Standardtexte verwendet.
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Suchen (Schlüssel oder Text)..."
              value={cmsSearchQuery}
              onChange={(e) => setCmsSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg"
              style={{ border: '1px solid var(--border-default)', background: 'var(--surface-page)' }}
            />
          </div>
        </div>
        <select
          value={cmsSelectedSection}
          onChange={(e) => setCmsSelectedSection(e.target.value)}
          className="px-4 py-2 rounded-lg"
          style={{ border: '1px solid var(--border-default)', background: 'var(--surface-page)' }}
        >
          <option value="">Alle Bereiche</option>
          {sections.map(section => (
            <option key={section} value={section}>{section}</option>
          ))}
        </select>
      </div>

      {/* Statistics */}
      <div className="mb-4 flex gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
        <span>{filteredTranslations.length} Einträge</span>
        <span>|</span>
        <span style={{ color: 'var(--status-success)' }}>
          {filteredTranslations.filter(t => t.isCustom).length} angepasst
        </span>
      </div>

      {/* Translations List */}
      <div className="space-y-2" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {Object.entries(groupedTranslations).map(([section, items]) => (
          <div key={section} className="border rounded-lg" style={{ borderColor: 'var(--border-default)' }}>
            <button
              onClick={() => toggleSection(section)}
              className="w-full px-4 py-3 flex items-center justify-between text-left"
              style={{ background: 'var(--surface-tint)' }}
            >
              <div className="flex items-center gap-2">
                {cmsExpandedSections.has(section) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{section}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                  ({items.length})
                </span>
              </div>
              {items.some(i => i.isCustom) && (
                <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'var(--status-success)', color: 'white' }}>
                  Angepasst
                </span>
              )}
            </button>
            
            {cmsExpandedSections.has(section) && (
              <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
                {items.map(item => (
                  <div key={item.fullKey} className="px-4 py-3">
                    {cmsEditingKey === item.fullKey ? (
                      // Edit mode
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                            {item.fullKey}
                          </code>
                          <div className="flex gap-2">
                            <button
                              onClick={saveTranslation}
                              className="px-3 py-1 rounded flex items-center gap-1 text-sm"
                              style={{ background: 'var(--status-success)', color: 'white' }}
                              disabled={saveStatus === 'saving'}
                            >
                              {saveStatus === 'saving' ? (
                                <RefreshCw size={14} className="animate-spin" />
                              ) : (
                                <Save size={14} />
                              )}
                              Speichern
                            </button>
                            <button
                              onClick={() => setCmsEditingKey(null)}
                              className="px-3 py-1 rounded flex items-center gap-1 text-sm"
                              style={{ border: '1px solid var(--border-default)' }}
                            >
                              <X size={14} />
                              Abbrechen
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                              🇩🇪 Deutsch
                            </label>
                            <textarea
                              value={cmsEditValues.de}
                              onChange={(e) => setCmsEditValues({ ...cmsEditValues, de: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg"
                              style={{ border: '1px solid var(--border-default)', background: 'var(--surface-page)', minHeight: '80px' }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                              🇬🇧 English
                            </label>
                            <textarea
                              value={cmsEditValues.en}
                              onChange={(e) => setCmsEditValues({ ...cmsEditValues, en: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg"
                              style={{ border: '1px solid var(--border-default)', background: 'var(--surface-page)', minHeight: '80px' }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div 
                        className="flex items-start justify-between cursor-pointer hover:bg-opacity-50"
                        onClick={() => startEditing(item)}
                      >
                        <div className="flex-1">
                          <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                            {item.key}
                          </code>
                          <div className="grid grid-cols-2 gap-4 mt-1">
                            <div className="text-sm">
                              <span style={{ color: 'var(--text-muted)' }}>🇩🇪</span>{' '}
                              <span style={{ color: item.isCustom ? 'var(--status-success)' : 'inherit' }}>
                                {item.deValue.length > 60 ? item.deValue.substring(0, 60) + '...' : item.deValue}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span style={{ color: 'var(--text-muted)' }}>🇬🇧</span>{' '}
                              <span style={{ color: item.isCustom ? 'var(--status-success)' : 'inherit' }}>
                                {item.enValue.length > 60 ? item.enValue.substring(0, 60) + '...' : item.enValue}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {item.isCustom && (
                            <button
                              onClick={(e) => { e.stopPropagation(); resetToDefault(item); }}
                              className="p-1 rounded hover:bg-opacity-80"
                              style={{ color: 'var(--text-muted)' }}
                              title="Auf Standard zurücksetzen"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredTranslations.length === 0 && (
        <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
          Keine Übersetzungen gefunden
        </div>
      )}
    </div>
  );
}
