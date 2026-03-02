'use client';

import { useState, useEffect, useRef } from 'react';
import { Lock, FileCode, CheckCircle, AlertCircle, Copy, Download, RefreshCw, Upload, Trash2, RotateCcw, Github, X, Folder, ChevronLeft, File } from 'lucide-react';
import Button from '@/components/ui/Button';
import { copyToClipboard } from '@/lib/utils';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-lua';
import 'prismjs/themes/prism-tomorrow.css';

type Preset = 'Minify' | 'Weak' | 'Medium' | 'Strong';
type LuaVersion = 'lua51' | 'luau';

const PRESETS = [
  { id: 'Minify', name: 'Minify', description: 'Removes whitespace/comments' },
  { id: 'Weak', name: 'Weak', description: 'Basic renaming & encoding' },
  { id: 'Medium', name: 'Medium', description: 'Balanced protection' },
  { id: 'Strong', name: 'Strong', description: 'Maximum security with VM' },
];

export default function ObfuscatorPage() {
  const [code, setCode] = useState('');
  const [obfuscatedCode, setObfuscatedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<Preset>('Medium');
  const [luaVersion, setLuaVersion] = useState<LuaVersion>('luau');
  const [fileName, setFileName] = useState('obfuscated_script');
  const [copied, setCopied] = useState(false);
  
  /* GitHub State */
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  
  // File Explorer State
  const [currentPath, setCurrentPath] = useState('');
  const [dirContents, setDirContents] = useState<any[]>([]);
  const [loadingDir, setLoadingDir] = useState(false);

  const [githubPath, setGithubPath] = useState('scripts/obfuscated.lua');
  const [commitMessage, setCommitMessage] = useState('Update obfuscated script');
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  /* Load Token from LocalStorage */
  useEffect(() => {
      const storedToken = localStorage.getItem('seisen_github_pat');
      if (storedToken) setGithubToken(storedToken);
  }, []);

  /* Save Token to LocalStorage */
  useEffect(() => {
      if (githubToken) {
          localStorage.setItem('seisen_github_pat', githubToken);
      }
  }, [githubToken]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .custom-editor .token.comment { color: #6a9955 !important; font-style: italic; }
      .custom-editor .token.string { color: #ce9178 !important; }
      .custom-editor .token.keyword { color: #c586c0 !important; font-weight: bold; }
      .custom-editor .token.function { color: #dcdcaa !important; }
      .custom-editor .token.number { color: #b5cea8 !important; }
      .custom-editor .token.operator { color: #d4d4d4 !important; }
      .custom-editor .token.punctuation { color: #808080 !important; }
      .custom-editor .token.boolean { color: #569cd6 !important; }
      .custom-editor .token.builtin { color: #4ec9b0 !important; }
      .custom-editor .token.constant { color: #4fc1ff !important; }
      .custom-editor textarea { outline: none !important; }
    `;
    document.head.appendChild(style);
    return () => { if (document.head.contains(style)) document.head.removeChild(style); };
  }, []);

  const handleReset = () => {
    setCode('');
    setObfuscatedCode('');
    setError(null);
  };

  const handleObfuscate = async () => {
    if (!code.trim()) {
      setError('Please enter some Lua code first');
      return;
    }

    setLoading(true);
    setError(null);
    setObfuscatedCode('');

    try {
      const response = await fetch(`/api/obfuscate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          version: luaVersion,
          preset,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.line) {
             throw new Error(`Syntax Error at Line ${data.line}: ${data.details}`);
        }
        throw new Error(data.error || data.details || 'Obfuscation failed');
      }

      if (data.obfuscated) {
        const watermark = "--[[ Seisen Obfuscator v1.0 | Protected by Seisen ]]\n";
        setObfuscatedCode(watermark + data.obfuscated);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (obfuscatedCode) {
      await copyToClipboard(obfuscatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!obfuscatedCode) return;
    const blob = new Blob([obfuscatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.endsWith('.lua') ? fileName : fileName + '.lua'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024 * 5) { // 5MB limit
      setError('File is too large (max 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        setCode(text);
        setError(null);
      }
    };
    reader.readAsText(file);
  };

  /* GitHub Logic */
  const fetchRepos = async () => {
    if (!githubToken) return;
    try {
      setLoading(true);
      const res = await fetch('/api/github/repos', {
        headers: { Authorization: `Bearer ${githubToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setGithubRepos(data.repos);
      } else {
        setError(data.error);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDirContents = async (repo: any, path: string) => {
    if (!githubToken || !repo) return;
    setLoadingDir(true);
    try {
        const owner = repo.full_name.split('/')[0];
        const res = await fetch(`/api/github/tree?owner=${owner}&repo=${repo.name}&path=${encodeURIComponent(path)}`, {
            headers: { Authorization: `Bearer ${githubToken}` }
        });
        const data = await res.json();
        if (res.ok) {
            setDirContents(data.items || []);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoadingDir(false);
    }
  };

  // Reset explorer when repo changes
  useEffect(() => {
    if (selectedRepo) {
        setCurrentPath('');
        fetchDirContents(selectedRepo, '');
    }
  }, [selectedRepo]);

  const handleNavigate = (path: string) => {
      setCurrentPath(path);
      fetchDirContents(selectedRepo, path);
  };

  const handleGoBack = () => {
      const parts = currentPath.split('/');
      parts.pop();
      const newPath = parts.join('/');
      // If parts was empty or 1 element, newPath might be empty string which is root
      handleNavigate(newPath === '' && currentPath.indexOf('/') === -1 ? '' : newPath);
  };

  // Helper for safe UTF-8 Base64 encoding in browser
  const toBase64 = (str: string) => {
    return window.btoa(unescape(encodeURIComponent(str)));
  };

  const handlePushToGithub = async () => {
    if (!githubToken || !selectedRepo || !githubPath || !obfuscatedCode) return;
    setIsPushing(true);
    setPushStatus('Preparing...');
    
    try {
      const owner = selectedRepo.full_name.split('/')[0];
      const repo = selectedRepo.name;
      const branch = selectedRepo.default_branch || 'main'; // Fallback to main if undefined
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${githubPath}`;

      // 1. Get current SHA (if file exists)
      let sha: string | undefined;
      try {
        const getRes = await fetch(`${apiUrl}?ref=${branch}`, {
            headers: { 
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (getRes.ok) {
            const getData = await getRes.json();
            sha = getData.sha;
        } else if (getRes.status !== 404) {
             throw new Error(`Failed to check file existence: ${getRes.statusText}`);
        }
      } catch (err) {
        console.warn('Error fetching file SHA:', err);
        // Continue, assuming new file if not found or other non-critical error
      }

      setPushStatus('Pushing to GitHub...');

      // 2. Push File
      const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: commitMessage || `Update ${githubPath}`,
          content: toBase64(obfuscatedCode),
          branch: branch,
          sha: sha, // Include SHA if we are updating an existing file
        })
      });

      const putData = await putRes.json();

      if (putRes.ok) {
        setPushStatus('Success!');
        setTimeout(() => {
            setShowGithubModal(false);
            setPushStatus(null);
        }, 1500);
      } else {
        throw new Error(putData.message || 'Failed to push file');
      }

    } catch (e: any) {
        setPushStatus(`Error: ${e.message}`);
    } finally {
      setIsPushing(false);
    }
  };
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<number[]>([]); // indices of matches
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  
  const [showGoToLine, setShowGoToLine] = useState(false);
  const [goToLineNumber, setGoToLineNumber] = useState('');

  /* Refs */
  const inputEditorRef = useRef<HTMLDivElement>(null);
  const inputGutterRef = useRef<HTMLDivElement>(null);
  const outputEditorRef = useRef<HTMLDivElement>(null);
  const outputGutterRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const goToLineInputRef = useRef<HTMLInputElement>(null);

  const handleScroll = (editorRef: any, gutterRef: any) => {
    if (editorRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = editorRef.current.scrollTop;
    }
  };

  const inputLineCount = code.split('\n').length;
  const outputLineCount = obfuscatedCode ? obfuscatedCode.split('\n').length : 0;

  /* Helper: Find specific textarea */
  const getTextArea = () => {
    return inputEditorRef.current?.querySelector('textarea');
  };

  /* Search Logic */
  useEffect(() => {
    if (!searchQuery) {
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }
    const matches: number[] = [];
    let pos = code.indexOf(searchQuery);
    while (pos !== -1) {
      matches.push(pos);
      pos = code.indexOf(searchQuery, pos + 1);
    }
    setSearchMatches(matches);
    if (matches.length > 0) {
      setCurrentMatchIndex(0);
      highlightMatch(matches[0]);
    } else {
      setCurrentMatchIndex(-1);
    }
  }, [searchQuery, code]);

  const highlightMatch = (index: number) => {
    const textarea = getTextArea();
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(index, index + searchQuery.length);
      // Calculating scroll position is tricky with simple-editor, but focusing often scrolls.
      // If we need explicit scrolling, we'd need line height calc.
      // Usually setSelectionRange scrolls nicely.
    }
  };

  const nextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIndex);
    highlightMatch(searchMatches[nextIndex]);
  };

  const prevMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIndex = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIndex);
    highlightMatch(searchMatches[prevIndex]);
  };

  /* Go To Line Logic */
  const handleGoToLine = () => {
    const line = parseInt(goToLineNumber);
    if (isNaN(line) || line < 1 || line > inputLineCount) return;

    // Estimate position: line * 19.5px (font size 13 * 1.5 lineHeight approx)
    // "Fira Code", fontsize 13, padding 16 top.
    // Line height default is usually around 1.5ish or 20px.
    // Let's try to grab the textarea and scroll it.
    
    // Better: find newline chars.
    const lines = code.split('\n');
    let charIndex = 0;
    for (let i = 0; i < line - 1; i++) {
      charIndex += lines[i].length + 1; // +1 for \n
    }
    
    const textarea = getTextArea();
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(charIndex, charIndex);
      // Force scroll a bit roughly
      // We can also set scrollTop on the container
      if(inputEditorRef.current) {
        // Approximate line height for Fira Code 13px is ~20px
        // Padding top is 16px.
        const lineHeight = 20; 
        inputEditorRef.current.scrollTop = (line - 1) * lineHeight;
      }
    }
    setShowGoToLine(false);
  };

  /* Keyboard Shortcuts */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowGoToLine(false);
        setShowSearch(prev => !prev);
        if (!showSearch) setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      // Ctrl+G
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setShowSearch(false);
        setShowGoToLine(prev => !prev);
        if (!showGoToLine) {
           setGoToLineNumber('');
           setTimeout(() => goToLineInputRef.current?.focus(), 50);
        }
      }
      // Esc
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowGoToLine(false);
        getTextArea()?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch, showGoToLine]);

  /* Performance constant */
  const MAX_HIGHLIGHT_LENGTH = 20000;

  return (
    <div className="h-screen bg-[#0d0d0d] text-gray-300 font-sans flex flex-col overflow-hidden">
      {/* Top IDE Header */}
      <div className="h-12 border-b border-[#252525] bg-[#181818] flex items-center justify-between px-4 sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-6 h-6 flex items-center justify-center rounded-md accent-text group-hover:scale-110 transition-transform accent-bg">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold tracking-tight text-white/90">Seisen Obfuscator</span>
          </div>

          <div className="h-4 w-[1px] bg-[#333] hidden md:block" />

          {/* Config Bar */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Version</span>
              <div className="flex bg-[#0a0a0a] p-0.5 rounded-md border border-[#333]">
                {(['lua51', 'luau'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setLuaVersion(v)}
                    title={v === 'luau' ? 'Recommended for Roblox' : 'Standard 5.1'}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      luaVersion === v ? 'bg-[#2d2d2d] accent-text' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {v === 'lua51' ? '5.1' : 'U'}
                  </button>
                ))}
              </div>
            </div>


          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400 text-[10px] font-bold transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RESET</span>
          </button>
          <Button 
            className="h-7 px-4 text-[10px] font-black tracking-widest uppercase rounded shadow-lg shadow-emerald-500/10 transition-all hover:scale-105"
            onClick={handleObfuscate}
            disabled={loading}
          >
            {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>PROTECT</span>}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 flex-1 overflow-hidden min-h-0">
        {/* Input */}
        <div className="flex flex-col border-r border-[#252525] bg-[#1e1e1e] relative min-h-0 group/editor">
          <div className="h-9 bg-[#252526] flex items-center px-0 shrink-0">
            <div className="h-full px-4 bg-[#1e1e1e] text-white flex items-center gap-2 text-xs font-medium border-r border-[#1e1e1e]">
              <FileCode className="w-3.5 h-3.5 text-orange-400" />
              <span>input.lua</span>
            </div>
            {code.length > MAX_HIGHLIGHT_LENGTH && (
               <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded text-[9px] font-mono border border-yellow-500/20 mr-4" title="Syntax highlighting disabled for better performance">
                  <AlertCircle className="w-3 h-3" />
                  <span>Low Latency Mode</span>
               </div>
            )}
            <div className="ml-auto flex items-center px-4 gap-4">
              <button
                onClick={() => setCode('local message = "Hello, Seisen!"\nprint(message)\n\nfor i = 1, 5 do\n    print("Count: " .. i)\nend')}
                className="text-[9px] font-black uppercase tracking-widest transition-colors" style={{ color: 'rgba(var(--accent-rgb), 0.8)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-hover)'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(var(--accent-rgb), 0.8)'}
              >
                Try Example
              </button>
              <label className="cursor-pointer text-gray-500 hover:text-gray-300 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <input type="file" className="hidden" accept=".lua,.txt" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
          
          {/* Search Widget */}
          {showSearch && (
            <div className="absolute top-10 right-4 z-50 bg-[#252526] border border-[#333] shadow-xl rounded-md flex items-center p-1 gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="relative">
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Find"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.shiftKey ? prevMatch() : nextMatch();
                    }
                  }}
                  className="w-48 bg-[#1e1e1e] border border-[#333] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[var(--accent)]/50 placeholder:text-gray-600"
                />
              </div>
              <div className="flex items-center text-[10px] text-gray-500 font-mono px-2 min-w-[50px] justify-center">
                {searchMatches.length > 0 ? `${currentMatchIndex + 1} of ${searchMatches.length}` : 'No results'}
              </div>
              <button onClick={prevMatch} className="p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white" title="Previous (Shift+Enter)">
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
              </button>
              <button onClick={nextMatch} className="p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white" title="Next (Enter)">
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              <button onClick={() => { setShowSearch(false); getTextArea()?.focus(); }} className="p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white ml-1">
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          )}

          {/* Go To Line Widget */}
          {showGoToLine && (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 bg-[#252526] border border-[#333] shadow-xl rounded-md p-2 flex flex-col gap-2 w-64 animate-in fade-in slide-in-from-top-2 duration-200">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Go to Line</span>
              <div className="flex gap-2">
                <input 
                  ref={goToLineInputRef}
                  type="number" 
                  min="1"
                  max={inputLineCount}
                  value={goToLineNumber}
                  onChange={(e) => setGoToLineNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGoToLine()}
                  placeholder={`1 - ${inputLineCount}`}
                  className="flex-1 bg-[#1e1e1e] border border-[#333] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[var(--accent)]/50 placeholder:text-gray-600 appearance-none"
                />
                <button 
                  onClick={handleGoToLine}
                  className="px-3 py-1 accent-bg accent-text hover-accent-bg rounded text-[10px] font-bold uppercase transition-colors"
                >
                  Go
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-hidden flex min-h-0">
            {/* Gutter */}
            <div 
              ref={inputGutterRef}
              className="w-10 bg-[#1e1e1e] pt-4 flex flex-col items-center text-[#858585] font-mono text-[10px] select-none border-r border-[#2d2d2d]/10 shrink-0 overflow-hidden"
            >
              <div className="animate-in fade-in duration-500">
                {Array.from({ length: Math.max(inputLineCount, 30) }).map((_, i) => (
                  <div key={i} className="h-5 flex items-center">{i + 1}</div>
                ))}
              </div>
            </div>

            <div 
              ref={inputEditorRef}
              onScroll={() => handleScroll(inputEditorRef, inputGutterRef)}
              className="flex-1 overflow-auto custom-editor scrollbar-thin scrollbar-thumb-white/10"
            >
              <Editor
                value={code}
                onValueChange={setCode}
                highlight={code => code.length < MAX_HIGHLIGHT_LENGTH ? Prism.highlight(code, Prism.languages.lua, 'lua') : code}
                padding={16}
                style={{ 
                  fontFamily: '"Fira Code", monospace', 
                  fontSize: 13,
                  minHeight: '100%',
                }}
                className="focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="absolute bottom-4 left-4 right-4 bg-[#252526] border border-red-500/20 shadow-2xl rounded p-3 z-50">
              <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase mb-2">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Problem Detected</span>
              </div>
              <p className="text-red-400/90 font-mono text-[10px] leading-relaxed break-words">{error}</p>
            </div>
          )}
        </div>

        {/* Output */}
        <div className="flex flex-col bg-[#1e1e1e] min-h-0">
          <div className="h-9 bg-[#252526] flex items-center px-0 shrink-0">
            <div className={`h-full px-4 flex items-center gap-2 text-xs font-medium transition-all ${obfuscatedCode ? 'bg-[#1e1e1e] text-white' : 'bg-[#2d2d2d]/30 text-gray-500'}`}>
              <CheckCircle className={`w-3.5 h-3.5 ${obfuscatedCode ? 'accent-text' : 'text-gray-600'}`} />
              <span>obfuscated.lua</span>
            </div>
            {obfuscatedCode && obfuscatedCode.length > MAX_HIGHLIGHT_LENGTH && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded text-[9px] font-mono border border-yellow-500/20 mr-4 ml-auto" title="Syntax highlighting disabled for better performance">
                  <AlertCircle className="w-3 h-3" />
                  <span>Low Latency Mode</span>
               </div>
            )}
            {obfuscatedCode && (
              <div className={obfuscatedCode && obfuscatedCode.length > MAX_HIGHLIGHT_LENGTH ? "flex items-center px-4 gap-2" : "ml-auto flex items-center px-4 gap-2"}>
                <button
                  onClick={handleCopy}
                  className="px-2 py-1 rounded text-[10px] font-bold bg-[#333] hover:bg-[#444] text-gray-300 flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  {copied ? 'COPIED' : 'COPY'}
                </button>
                <div className="flex items-center gap-1 p-0.5 bg-[#0a0a0a] rounded border border-[#333]">
                  <input 
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="bg-transparent border-none outline-none text-[10px] font-medium text-gray-300 w-20 px-1 focus:ring-0"
                  />
                  <button onClick={handleDownload} className="px-2 py-0.5 rounded text-[10px] font-bold accent-bg accent-text hover:opacity-80 transition-colors">
                    SAVE
                  </button>
                </div>
                <button
                    onClick={() => setShowGithubModal(true)}
                    className="ml-2 px-2 py-1 rounded text-[10px] font-bold bg-[#2da44e]/20 text-[#2da44e] hover:bg-[#2da44e]/30 flex items-center gap-1.5 transition-colors"
                >
                    <Github className="w-3 h-3" />
                    PUSH
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden flex relative min-h-0">
            <div 
              ref={outputGutterRef}
              className="w-10 bg-[#1e1e1e] pt-4 flex flex-col items-center text-[#858585] font-mono text-[10px] select-none border-r border-[#2d2d2d]/10 shrink-0 overflow-hidden"
            >
              <div className="animate-in fade-in duration-500">
                {Array.from({ length: Math.max(outputLineCount, 30) }).map((_, i) => (
                  <div key={i} className="h-5 flex items-center">{i + 1}</div>
                ))}
              </div>
            </div>

            <div 
              ref={outputEditorRef}
              onScroll={() => handleScroll(outputEditorRef, outputGutterRef)}
              className="flex-1 overflow-auto custom-editor scrollbar-thin scrollbar-thumb-white/10"
            >
              <Editor
                value={obfuscatedCode}
                onValueChange={() => {}}
                highlight={code => code.length < MAX_HIGHLIGHT_LENGTH ? Prism.highlight(code, Prism.languages.lua, 'lua') : code}
                padding={16}
                readOnly
                style={{ 
                  fontFamily: '"Fira Code", monospace', 
                  fontSize: 13,
                  minHeight: '100%',
                }}
                className="focus:outline-none"
              />
              {!obfuscatedCode && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
                  <Lock className="w-10 h-10 mb-2 text-gray-500" />
                  <p className="text-[9px] font-black tracking-widest uppercase text-gray-500">Ready</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="h-5 bg-[var(--accent)] flex items-center justify-between px-3 text-white text-[9px] font-bold uppercase shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <RefreshCw className={`w-2 h-2 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Processing...' : 'Ready'}</span>
          </div>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{preset}</span>
          <span>{luaVersion === 'lua51' ? 'Lua 5.1' : 'LuaU'}</span>
        </div>
      </div>
      {/* GitHub Modal */}
      {showGithubModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-[#333] bg-[#252526]">
                    <div className="flex items-center gap-2">
                        <Github className="w-4 h-4 text-white" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Push to GitHub</span>
                    </div>
                    <button onClick={() => setShowGithubModal(false)}><X className="w-4 h-4 text-gray-500 hover:text-white" /></button>
                </div>
                
                <div className="p-4 space-y-4">
                    {/* Token Input */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Personal Access Token (PAT)</label>
                            <a 
                                href="https://github.com/settings/tokens/new?scopes=repo&description=Seisen%20Obfuscator" 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[9px] accent-text hover:underline"
                            >
                                Get Token (Requires 'repo')
                            </a>
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="password" 
                                value={githubToken}
                                onChange={(e) => setGithubToken(e.target.value)}
                                placeholder="ghp_..."
                                className="flex-1 bg-[#141414] border border-[#333] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--accent)]/50"
                            />
                            <button 
                                onClick={fetchRepos}
                                disabled={!githubToken || loading}
                                className="px-3 py-1 bg-[#333] hover:bg-[#444] text-xs font-bold text-white rounded disabled:opacity-50"
                            >
                                {loading ? '...' : 'Connect'}
                            </button>
                        </div>
                    </div>

                    {/* Repo Selection */}
                    {githubRepos.length > 0 && (
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                             <label className="text-[10px] font-bold text-gray-400 uppercase">Repository</label>
                             <select 
                                onChange={(e) => setSelectedRepo(githubRepos.find(r => r.id === parseInt(e.target.value)))}
                                className="w-full bg-[#141414] border border-[#333] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--accent)]/50"
                             >
                                <option value="">Select a repository...</option>
                                {githubRepos.map(repo => (
                                    <option key={repo.id} value={repo.id}>{repo.full_name}</option>
                                ))}
                             </select>
                        </div>
                    )}

                    {/* File Explorer & Details */}
                    {selectedRepo && (
                         <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            
                            {/* Browser */}
                            <div className="border border-[#333] rounded-md bg-[#141414] overflow-hidden flex flex-col h-48">
                                <div className="bg-[#252526] p-2 flex items-center gap-2 border-b border-[#333] text-xs">
                                    {currentPath ? (
                                        <button onClick={handleGoBack} className="p-1 hover:bg-[#333] rounded"><ChevronLeft className="w-3.5 h-3.5 text-gray-400" /></button>
                                    ) : <div className="w-5.5" />} {/* Spacer */}
                                    <span className="font-mono text-gray-400 truncate">/{currentPath}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-1 space-y-0.5 scrollbar-thin scrollbar-thumb-[#333]">
                                    {loadingDir ? (
                                        <div className="p-4 text-center text-xs text-gray-500">Loading...</div>
                                    ) : dirContents.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-gray-600">Empty directory</div>
                                    ) : (
                                        dirContents.map(item => (
                                            <div 
                                                key={item.path}
                                                onClick={() => {
                                                    if(item.type === 'dir') handleNavigate(item.path);
                                                    else setGithubPath(item.path);
                                                }}
                                                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs group ${item.path === githubPath ? 'accent-bg accent-text' : 'hover:bg-[#252526] text-gray-300'}`}
                                            >
                                                {item.type === 'dir' ? <Folder className="w-3.5 h-3.5 text-yellow-500/80" /> : <File className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-400" />}
                                                <span className="truncate">{item.name}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Target Path</label>
                                <input 
                                    type="text" 
                                    value={githubPath}
                                    onChange={(e) => setGithubPath(e.target.value)}
                                    placeholder="Enter path (e.g., scripts/new.lua)"
                                    className="w-full bg-[#141414] border border-[#333] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--accent)]/50 font-mono"
                                />
                                <p className="text-[9px] text-gray-500">Select a file above to overwrite, or type a new path.</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Commit Message</label>
                                <input 
                                    type="text" 
                                    value={commitMessage}
                                    onChange={(e) => setCommitMessage(e.target.value)}
                                    className="w-full bg-[#141414] border border-[#333] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--accent)]/50"
                                />
                            </div>
                         </div>
                    )}

                    {/* Status Message */}
                    {pushStatus && (
                        <div className={`p-2 rounded text-[10px] font-mono break-all ${pushStatus.startsWith('Success') ? 'accent-bg accent-text' : 'bg-red-500/10 text-red-500'}`}>
                            {pushStatus}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-[#333] bg-[#252526] flex justify-end gap-2">
                    <button onClick={() => setShowGithubModal(false)} className="px-3 py-1.5 text-gray-400 hover:text-white text-xs font-bold transition-colors">Cancel</button>
                    <button 
                        onClick={handlePushToGithub}
                        disabled={!selectedRepo || isPushing}
                        className="px-4 py-1.5 bg-[#2da44e] hover:bg-[#2c974b] text-white text-xs font-bold rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/20"
                    >
                         {isPushing && <RefreshCw className="w-3 h-3 animate-spin" />}
                         {isPushing ? 'Pushing...' : 'Push to GitHub'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
