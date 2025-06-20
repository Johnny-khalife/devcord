import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Send, Play, X, Maximize2, Minimize2, ChevronDown, ChevronUp, RotateCcw, Download } from 'lucide-react';
import '../styles/CodePlayground.css';
import { useFriendStore } from '../store/useFriendsStore';
import { useChatStore } from '../store/useChatStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useChannelStore } from '../store/useChannelStore';
import { toast } from 'react-hot-toast';

// Import CodeMirror components
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';

const CodePlayground = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initial code states
  const initialHtmlCode = '<!-- Enter HTML here -->\n<h1>Welcome to Devcord!</h1>\n<p>Start coding to see the preview</p>';
  const initialCssCode = '/* Enter CSS here */\nbody {\n  font-family: system-ui, sans-serif;\n  color: #333;\n  padding: 2rem;\n}\n\nh1 {\n  color: #2563eb;\n}';
  const initialJsCode = '// Enter JavaScript here\n';
  const initialReactCode = `// Write a React component (JSX or TSX)
// Example: Counter with a button
function App() {
  const [count, setCount] = useState(0);
  return (
    <div style={{ textAlign: 'center', marginTop: 40 }}>
      <h1>React Counter</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)} style={{ padding: '8px 16px', fontSize: 16 }}>
        Increment
      </button>
    </div>
  );
}`;
  
  // State for code editors
  const [htmlCode, setHtmlCode] = useState(() => localStorage.getItem('playground_html') ?? initialHtmlCode);
  const [cssCode, setCssCode] = useState(() => localStorage.getItem('playground_css') ?? initialCssCode);
  const [jsCode, setJsCode] = useState(() => localStorage.getItem('playground_js') ?? initialJsCode);
  const [reactCode, setReactCode] = useState(() => localStorage.getItem('playground_react') ?? initialReactCode);
  const [reactLanguage, setReactLanguage] = useState(() => localStorage.getItem('playground_react_lang') ?? 'jsx'); // 'jsx' or 'tsx'
  
  // State for preview
  const [previewCode, setPreviewCode] = useState('');
  
  // State for share modal
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState('channel');
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  
  // Get friends from friend store
  const { friends, getFriendsList, isLoading: friendsLoading } = useFriendStore();
  
  // Get workspaces and channels
  const { workspacesWithRoles, getUserWorkspaces, isLoading: workspacesLoading } = useWorkspaceStore();
  const { fetchWorkspaceChannels, isLoading: channelsLoading } = useChannelStore();
  const [channels, setChannels] = useState([]);
  
  // Get send direct message function from chat store
  const { sendDirectMessage, sendMessage } = useChatStore();
  
  // State for editor expansion
  const [expandedEditor, setExpandedEditor] = useState(null);
  const [collapsedEditors, setCollapsedEditors] = useState({
    html: false,
    css: false,
    js: false,
    react: false
  });

  // State for workspace dropdown
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const workspaceDropdownRef = useRef(null);
  
  // State for channel dropdown
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const channelDropdownRef = useRef(null);
  
  // Add mode state
  const [mode, setMode] = useState('html'); // 'html' or 'react'
  
  // State for React warning
  const [reactWarning, setReactWarning] = useState('');
  
  // On mount, if reactCode is present, set mode to 'react'
  useEffect(() => {
    if (reactCode && reactCode.trim() && reactCode !== initialReactCode) {
      setMode('react');
    }
  }, []);
  
  // Handle click outside dropdowns to close them
  useEffect(() => {
    function handleClickOutside(event) {
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(event.target)) {
        setShowWorkspaceDropdown(false);
      }
      if (channelDropdownRef.current && !channelDropdownRef.current.contains(event.target)) {
        setShowChannelDropdown(false);
      }
    }
    
    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [workspaceDropdownRef, channelDropdownRef]);

  // Load friends when component mounts
  useEffect(() => {
    if (shareModalOpen && shareTarget === 'dm') {
      getFriendsList();
    }
  }, [shareModalOpen, shareTarget, getFriendsList]);

  // Load workspaces when component mounts
  useEffect(() => {
    if (shareModalOpen && shareTarget === 'channel') {
      getUserWorkspaces();
    }
  }, [shareModalOpen, shareTarget, getUserWorkspaces]);

  // Load channels when workspace is selected
  useEffect(() => {
    async function loadChannels() {
      if (selectedWorkspaceId) {
        try {
          const channelsList = await fetchWorkspaceChannels(selectedWorkspaceId);
          setChannels(channelsList || []);
          setSelectedChannelId(''); // Reset channel selection when workspace changes
        } catch {
          toast.error('Failed to load channels');
        }
      }
    }
    
    loadChannels();
  }, [selectedWorkspaceId, fetchWorkspaceChannels]);

  // Handle editor expansion
  const toggleExpandEditor = (editorName) => {
    if (expandedEditor === editorName) {
      setExpandedEditor(null);
    } else {
      setExpandedEditor(editorName);
    }
  };

  // Handle editor collapse
  const toggleCollapseEditor = (editorName) => {
    setCollapsedEditors(prev => ({
      ...prev,
      [editorName]: !prev[editorName]
    }));
  };
  
  // Add a warning if user types import/export in React code
  useEffect(() => {
    if (mode === 'react') {
      if (/\bimport\b|\bexport\b/.test(reactCode)) {
        setReactWarning('⚠️ Do not use import or export statements in React code. Just define a component called App.');
      } else {
        setReactWarning('');
      }
    }
  }, [reactCode, mode]);

  // Debounced auto-preview
  useEffect(() => {
    const handler = setTimeout(() => {
      setPreviewCode(generateDocument());
    }, 500);
    return () => clearTimeout(handler);
  }, [htmlCode, cssCode, jsCode, reactCode, reactLanguage, mode]);

  // Robustly strip export default and import statements
  const stripReactCode = (code) => {
    // Remove all import lines
    let result = code.replace(/^[ \t]*import[^;\n]+;?[ \t]*$/gm, '');
    // Remove all export default (function, class, const, let, var, arrow)
    result = result.replace(/^[ \t]*export\s+default\s+/gm, '');
    // Remove all export { ... } or export *
    result = result.replace(/^[ \t]*export\s+\{[^}]*\};?[ \t]*$/gm, '');
    result = result.replace(/^[ \t]*export\s+\*.*$/gm, '');
    return result;
  };

  // Generate full HTML document for preview
  const generateDocument = () => {
    if (mode === 'react' && reactCode.trim()) {
      const babelPresets = reactLanguage === 'tsx' ? "react,typescript" : "react";
      let processedReactCode = stripReactCode(reactCode);
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${cssCode}</style>
          <style>
            #error-overlay { position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(255,0,0,0.1);color:#b91c1c;z-index:9999;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-family:monospace;padding:2rem;white-space:pre-wrap; }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <script type="text/babel" data-type="module" data-presets="${babelPresets}">
          try {
            var exports = {};
            // Make React hooks available globally
            const { useState, useEffect, useRef, useMemo, useCallback, useReducer, useContext, useLayoutEffect, useImperativeHandle, useDebugValue, useTransition, useDeferredValue, useId, useSyncExternalStore } = React;
            // User code (must define App)
            ${processedReactCode}
            App = (typeof App !== 'undefined' ? App : (typeof exports !== 'undefined' && exports.default ? exports.default : undefined));
            if (!App) throw new Error('No App component found. Please define a component called App.');
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(React.createElement(App));
          } catch (e) {
            document.body.innerHTML += '<div id="error-overlay">' + e + '</div>';
          }
          </script>
        </body>
        </html>
      `;
    }
    // Fallback to HTML/CSS/JS preview
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${cssCode}</style>
      </head>
      <body>
        ${htmlCode}
        <script>${jsCode}</script>
      </body>
      </html>
    `;
  };
  
  // Handle preview button click
  const handlePreview = () => {
    setPreviewCode(generateDocument());
  };
  
  // Handle share button click
  const handleShare = () => {
    setShareModalOpen(true);
  };
  
  // Handle sharing to selected target
  const handleShareSubmit = async () => {
    // For DM, use friend ID as target ID
    // For channel, use channel ID as target ID
    const targetId = shareTarget === 'dm' ? selectedFriendId : selectedChannelId;
    
    if (!targetId) {
      toast.error(`Please select a ${shareTarget === 'dm' ? 'friend' : 'channel'} to share with`);
      return;
    }
    
    if (shareTarget === 'channel' && !selectedWorkspaceId) {
      toast.error('Please select a workspace');
      return;
    }
    
    try {
      // Create code content with formatted code blocks
      let codeContent;
      let language = 'multiple';
      
      if (mode === 'react' && reactCode.trim()) {
        codeContent = `\n**React Code from Devcord Code Playground**\n\n\`\`\`${reactLanguage}\n${reactCode}\n\`\`\``;
        language = reactLanguage;
      } else if (mode === 'html' && htmlCode.trim() && cssCode.trim() && jsCode.trim()) {
        codeContent = `\n**Code Snippet from Devcord Code Playground**\n\n\`\`\`html\n${htmlCode}\n\`\`\`\n\`\`\`css\n${cssCode}\n\`\`\`\n\`\`\`javascript\n${jsCode}\n\`\`\``;
        language = 'multiple';
      } else if (mode === 'html' && htmlCode.trim()) {
        codeContent = `\`\`\`html\n${htmlCode}\n\`\`\``;
        language = 'html';
      } else if (mode === 'css' && cssCode.trim()) {
        codeContent = `\`\`\`css\n${cssCode}\n\`\`\``;
        language = 'css';
      } else if (mode === 'js' && jsCode.trim()) {
        codeContent = `\`\`\`javascript\n${jsCode}\n\`\`\``;
        language = 'javascript';
      } else {
        codeContent = "No code to share";
        language = 'plaintext';
      }
      
      // Common message data for both DM and channel
      const messageData = {
        message: codeContent,
        isCode: true,
        language: language
      };
      
      if (shareTarget === 'dm') {
        // Send to DM
        await sendDirectMessage(messageData, targetId);
        toast.success('Code snippet sent to friend successfully!');
      } else {
        // Send to channel - use the same messageData structure
        messageData.channelId = selectedChannelId;
        
        // Send message to channel
        await sendMessage(messageData, selectedWorkspaceId);
        toast.success('Code snippet sent to channel successfully!');
      }
      
      // Reset state
      setShareModalOpen(false);
      setSelectedFriendId('');
      setSelectedWorkspaceId('');
      setSelectedChannelId('');
    } catch {
      toast.error('Failed to share code snippet. Please try again.');
    }
  };

  // On mount, load code from localStorage if present
  useEffect(() => {
    const savedHtml = localStorage.getItem('playground_html');
    const savedCss = localStorage.getItem('playground_css');
    const savedJs = localStorage.getItem('playground_js');
    const savedReact = localStorage.getItem('playground_react');
    const savedReactLang = localStorage.getItem('playground_react_lang');
    if (savedHtml !== null) setHtmlCode(savedHtml);
    if (savedCss !== null) setCssCode(savedCss);
    if (savedJs !== null) setJsCode(savedJs);
    if (savedReact !== null) setReactCode(savedReact);
    if (savedReactLang === 'jsx' || savedReactLang === 'tsx') setReactLanguage(savedReactLang);
  }, []);

  // Save code to localStorage on change
  useEffect(() => { localStorage.setItem('playground_html', htmlCode); }, [htmlCode]);
  useEffect(() => { localStorage.setItem('playground_css', cssCode); }, [cssCode]);
  useEffect(() => { localStorage.setItem('playground_js', jsCode); }, [jsCode]);
  useEffect(() => { localStorage.setItem('playground_react', reactCode); }, [reactCode]);
  useEffect(() => { localStorage.setItem('playground_react_lang', reactLanguage); }, [reactLanguage]);

  // In handleReset, also clear localStorage
  const handleReset = () => {
    setHtmlCode(initialHtmlCode);
    setCssCode(initialCssCode);
    setJsCode(initialJsCode);
    setReactCode(initialReactCode);
    setPreviewCode('');
    setReactLanguage('jsx');
    localStorage.removeItem('playground_html');
    localStorage.removeItem('playground_css');
    localStorage.removeItem('playground_js');
    localStorage.removeItem('playground_react');
    localStorage.removeItem('playground_react_lang');
  };

  // Determine container classes based on expanded state
  const getEditorContainerClass = (editorName) => {
    if (expandedEditor === editorName) {
      return "fixed inset-0 z-50 p-4 bg-gray-900 bg-opacity-90 flex flex-col code-editor-expanded";
    }
    if (expandedEditor && expandedEditor !== editorName) {
      return "hidden";
    }
    return `bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden code-editor-container ${collapsedEditors[editorName] ? 'collapsed' : ''}`;
  };
  
  // Handle importing code from shared message
  const handleImportCode = (blockType, code) => {
    if (blockType && code) {
      if (blockType === 'html') {
        setHtmlCode(code);
        setMode('html');
      } else if (blockType === 'css') {
        setCssCode(code);
        setMode('html');
      } else if (blockType === 'js' || blockType === 'javascript') {
        setJsCode(code);
        setMode('html');
      } else if (blockType === 'jsx') {
        setReactCode(code);
        setReactLanguage('jsx');
        setMode('react');
      } else if (blockType === 'tsx') {
        setReactCode(code);
        setReactLanguage('tsx');
        setMode('react');
      }
      toast.success(`Imported ${blockType.toUpperCase()} code to playground!`);
      return;
    }
    // Fallback: import all code blocks as before
    try {
      const sharedCode = location.state?.sharedCode;
      if (!sharedCode) {
        toast.error('No code found to import');
        return;
      }
      const htmlMatch = sharedCode.match(/```html\n([\s\S]*?)\n```/);
      const cssMatch = sharedCode.match(/```css\n([\s\S]*?)\n```/);
      const jsMatch = sharedCode.match(/```javascript\n([\s\S]*?)\n```/);
      const jsxMatch = sharedCode.match(/```jsx\n([\s\S]*?)\n```/);
      const tsxMatch = sharedCode.match(/```tsx\n([\s\S]*?)\n```/);
      if (htmlMatch) setHtmlCode(htmlMatch[1]);
      if (cssMatch) setCssCode(cssMatch[1]);
      if (jsMatch) setJsCode(jsMatch[1]);
      if (jsxMatch) {
        setReactCode(jsxMatch[1]);
        setReactLanguage('jsx');
      }
      if (tsxMatch) {
        setReactCode(tsxMatch[1]);
        setReactLanguage('tsx');
      }
      navigate(location.pathname, { replace: true });
      toast.success('Code imported successfully!');
    } catch {
      toast.error('Failed to import code');
    }
  };

  // Add this useEffect after state declarations
  useEffect(() => {
    if (location.state?.sharedCode && location.state?.sharedLanguage) {
      const lang = location.state.sharedLanguage.toLowerCase();
      const code = location.state.sharedCode;
      if (lang === 'html') {
        setHtmlCode(code);
        setMode('html');
      } else if (lang === 'css') {
        setCssCode(code);
        setMode('html');
      } else if (lang === 'js' || lang === 'javascript') {
        setJsCode(code);
        setMode('html');
      } else if (lang === 'jsx') {
        setReactCode(code);
        setReactLanguage('jsx');
        setMode('react');
      } else if (lang === 'tsx') {
        setReactCode(code);
        setReactLanguage('tsx');
        setMode('react');
      }
      // Optionally clear the state after import
      navigate(location.pathname, { replace: true });
      toast.success(`Imported ${lang.toUpperCase()} code to playground!`);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 p-4 code-playground-container pt-16">
      <header className="flex justify-between items-center mb-4 pt-2">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Code Playground</h1>
        <div className="flex gap-2">
          {location.state?.sharedCode && (
            <button 
              onClick={() => handleImportCode(null, location.state.sharedCode)}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center gap-2"
            >
              <Download size={16} />
              Import Shared Code
            </button>
          )}
          <button 
            onClick={() => navigate(-1)} 
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-200"
          >
            Back
          </button>
        </div>
      </header>
      
      {/* Mode picker UI (add after header) */}
      <div className="flex items-center gap-4 mb-4">
        <span className={`font-semibold ${mode === 'html' ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`}>HTML / CSS / JS</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={mode === 'react'}
            onChange={e => setMode(e.target.checked ? 'react' : 'html')}
            className="sr-only peer"
            aria-label="Toggle React mode"
          />
          <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:bg-gray-700 rounded-full peer peer-checked:bg-purple-600 transition-colors duration-300"></div>
          <div className="absolute left-1 top-1 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300 peer-checked:translate-x-6"></div>
        </label>
        <span className={`font-semibold ${mode === 'react' ? 'text-purple-600' : 'text-gray-400 dark:text-gray-500'}`}>React (JSX / TSX)</span>
      </div>
      
      <div className={`flex flex-col lg:grid lg:grid-cols-2 gap-4 flex-grow min-h-0`}>
        {/* Editors Section */}
        <div className="flex flex-col gap-4 h-full min-h-0 relative">
          {/* Instructions */}
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 hidden md:block">
            <span><ChevronUp size={14} className="inline" /> Collapse | </span>
            <span><Maximize2 size={14} className="inline" /> Expand an editor for better visibility</span>
          </div>
          
          {/* HTML Editor */}
          {mode === 'html' && (
            <div className={getEditorContainerClass('html')}>
              <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 font-medium flex justify-between items-center">
                <span className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  HTML
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleCollapseEditor('html')} 
                    className="p-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                    aria-label={collapsedEditors.html ? "Expand HTML editor" : "Collapse HTML editor"}
                  >
                    {collapsedEditors.html ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </button>
                  <button 
                    onClick={() => toggleExpandEditor('html')} 
                    className="p-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                    aria-label={expandedEditor === 'html' ? "Minimize HTML editor" : "Maximize HTML editor"}
                  >
                    {expandedEditor === 'html' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                </div>
              </div>
              {!collapsedEditors.html && (
                <CodeMirror
                  value={htmlCode}
                  height={expandedEditor === 'html' ? 'calc(100vh - 160px)' : '180px'}
                  onChange={(value) => setHtmlCode(value)}
                  extensions={[html()]}
                  theme="dark"
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLine: true,
                    highlightSelectionMatches: true,
                    autocompletion: true,
                  }}
                  className="code-editor"
                />
              )}
            </div>
          )}
          
          {/* CSS Editor */}
          {mode === 'html' && (
            <div className={getEditorContainerClass('css')}>
              <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 font-medium flex justify-between items-center">
                <span className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                  CSS
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleCollapseEditor('css')} 
                    className="p-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                    aria-label={collapsedEditors.css ? "Expand CSS editor" : "Collapse CSS editor"}
                  >
                    {collapsedEditors.css ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </button>
                  <button 
                    onClick={() => toggleExpandEditor('css')} 
                    className="p-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                    aria-label={expandedEditor === 'css' ? "Minimize CSS editor" : "Maximize CSS editor"}
                  >
                    {expandedEditor === 'css' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                </div>
              </div>
              {!collapsedEditors.css && (
                <CodeMirror
                  value={cssCode}
                  height={expandedEditor === 'css' ? 'calc(100vh - 160px)' : '180px'}
                  onChange={(value) => setCssCode(value)}
                  extensions={[css()]}
                  theme="dark"
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLine: true,
                    highlightSelectionMatches: true,
                    autocompletion: true,
                  }}
                  className="code-editor"
                />
              )}
            </div>
          )}
          
          {/* JavaScript Editor */}
          {mode === 'html' && (
            <div className={getEditorContainerClass('js')}>
              <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 font-medium flex justify-between items-center">
                <span className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                  JavaScript
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleCollapseEditor('js')} 
                    className="p-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                    aria-label={collapsedEditors.js ? "Expand JS editor" : "Collapse JS editor"}
                  >
                    {collapsedEditors.js ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </button>
                  <button 
                    onClick={() => toggleExpandEditor('js')} 
                    className="p-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                    aria-label={expandedEditor === 'js' ? "Minimize JS editor" : "Maximize JS editor"}
                  >
                    {expandedEditor === 'js' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                </div>
              </div>
              {!collapsedEditors.js && (
                <CodeMirror
                  value={jsCode}
                  height={expandedEditor === 'js' ? 'calc(100vh - 160px)' : '180px'}
                  onChange={(value) => setJsCode(value)}
                  extensions={[javascript()]}
                  theme="dark"
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLine: true,
                    highlightSelectionMatches: true,
                    autocompletion: true,
                  }}
                  className="code-editor"
                />
              )}
            </div>
          )}
          
          {/* React/JSX/TSX Editor */}
          {mode === 'react' && (
            <div className={getEditorContainerClass('react') + ' flex flex-col flex-1 min-h-0 h-full'}>
              <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 font-medium flex justify-between items-center">
                <span className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                  React ({reactLanguage.toUpperCase()})
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={reactLanguage}
                    onChange={e => setReactLanguage(e.target.value)}
                    className="text-xs rounded px-1 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
                  >
                    <option value="jsx">JSX</option>
                    <option value="tsx">TSX</option>
                  </select>
                  <button 
                    onClick={() => toggleCollapseEditor('react')} 
                    className="p-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                    aria-label={collapsedEditors.react ? "Expand React editor" : "Collapse React editor"}
                  >
                    {collapsedEditors.react ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </button>
                  <button 
                    onClick={() => toggleExpandEditor('react')} 
                    className="p-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                    aria-label={expandedEditor === 'react' ? "Minimize React editor" : "Maximize React editor"}
                  >
                    {expandedEditor === 'react' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                </div>
              </div>
              {!collapsedEditors.react && (
                <CodeMirror
                  value={reactCode}
                  height="100%"
                  onChange={value => setReactCode(value)}
                  extensions={[javascript({ jsx: true, typescript: reactLanguage === 'tsx' })]}
                  theme="dark"
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLine: true,
                    highlightSelectionMatches: true,
                    autocompletion: true,
                  }}
                  className="code-editor flex-1 min-h-0 h-full"
                />
              )}
              {reactWarning && (
                <div className="text-xs text-red-600 dark:text-red-400 px-4 py-1">{reactWarning}</div>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400 px-4 py-1">Do not use <code>import</code> or <code>export</code>. Just define a component called <b>App</b>. You can use hooks, etc. (No imports needed)</div>
            </div>
          )}
          
          {/* Buttons at the bottom, sticky */}
          <div className="flex gap-2 mt-auto sticky bottom-0 bg-gray-100 dark:bg-gray-900 py-4 z-10">
            <button 
              onClick={handlePreview}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              <Play size={18} />
              Preview
            </button>
            <button 
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
            >
              <RotateCcw size={18} />
              Reset
            </button>
            <button 
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
            >
              <Send size={18} />
              Share
            </button>
          </div>
        </div>
        
        {/* Preview Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col preview-container mt-4 lg:mt-0">
          <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 font-medium">Preview</div>
          <div className="flex-grow p-4 bg-white dark:bg-gray-800 min-h-[300px] lg:min-h-0">
            {previewCode ? (
              <iframe 
                srcDoc={previewCode}
                sandbox="allow-scripts"
                className="w-full h-full border-2 border-gray-300 dark:border-gray-600 rounded-md"
                title="Code Preview"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                Click the Preview button to see your code in action
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Return button for expanded editor view */}
      {expandedEditor && (
        <div className="fixed bottom-4 right-4 z-50">
          <button 
            onClick={() => setExpandedEditor(null)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-lg"
          >
            <Minimize2 size={18} />
            Exit Fullscreen
          </button>
        </div>
      )}
      
      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4 modal-content">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Share Code Snippet</h3>
              <button onClick={() => setShareModalOpen(false)} className="text-gray-500">
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Share to:
              </label>
              <select 
                value={shareTarget}
                onChange={(e) => {
                  setShareTarget(e.target.value);
                  setSelectedFriendId('');
                  setSelectedWorkspaceId('');
                  setSelectedChannelId('');
                }}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="channel">Send to Channel</option>
                <option value="dm">Send to DM</option>
              </select>
            </div>
            
            {shareTarget === 'dm' && (
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Friend:
                </label>
                {friendsLoading ? (
                  <div className="text-center py-2">Loading friends...</div>
                ) : friends.length > 0 ? (
                  <select 
                    value={selectedFriendId}
                    onChange={(e) => setSelectedFriendId(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select a friend</option>
                    {friends.map(friend => (
                      <option key={friend.friendId} value={friend.friendId}>
                        {friend.username}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-center py-2 text-yellow-600 dark:text-yellow-400">
                    No friends found. Add friends to share code with them.
                  </div>
                )}
              </div>
            )}
            
            {shareTarget === 'channel' && (
              <>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Workspace:
                  </label>
                  {workspacesLoading ? (
                    <div className="text-center py-2">Loading workspaces...</div>
                  ) : workspacesWithRoles.length > 0 ? (
                    <div className="relative" ref={workspaceDropdownRef}>
                      <div 
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer flex justify-between items-center"
                        onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
                      >
                        <span>
                          {selectedWorkspaceId 
                            ? workspacesWithRoles.find(w => w._id === selectedWorkspaceId)?.name || 
                              workspacesWithRoles.find(w => w._id === selectedWorkspaceId)?.workspaceName 
                            : 'Select a workspace'}
                        </span>
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                      
                      {showWorkspaceDropdown && (
                        <div className="absolute z-20 mt-1 w-full rounded-md bg-white dark:bg-gray-800 shadow-lg max-h-60 overflow-auto">
                          <div className="py-1">
                            <div 
                              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                              onClick={() => {
                                setSelectedWorkspaceId('');
                                setSelectedChannelId('');
                                setShowWorkspaceDropdown(false);
                              }}
                            >
                              Select a workspace
                            </div>
                            {workspacesWithRoles.map(workspace => (
                              <div 
                                key={workspace._id}
                                className={`px-4 py-2 text-sm cursor-pointer ${
                                  selectedWorkspaceId === workspace._id
                                    ? "bg-blue-500 text-white"
                                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                                onClick={() => {
                                  setSelectedWorkspaceId(workspace._id);
                                  setSelectedChannelId(''); // Reset channel selection when workspace changes
                                  setShowWorkspaceDropdown(false);
                                }}
                              >
                                {workspace.name || workspace.workspaceName}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-2 text-yellow-600 dark:text-yellow-400">
                      No workspaces found. Create or join a workspace first.
                    </div>
                  )}
                </div>
                
                {selectedWorkspaceId && (
                  <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Select Channel:
                    </label>
                    {channelsLoading ? (
                      <div className="text-center py-2">Loading channels...</div>
                    ) : channels.length > 0 ? (
                      <div className="relative" ref={channelDropdownRef}>
                        <div 
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer flex justify-between items-center"
                          onClick={() => setShowChannelDropdown(!showChannelDropdown)}
                        >
                          <span>{selectedChannelId ? channels.find(c => c._id === selectedChannelId)?.channelName : 'Select a channel'}</span>
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                        
                        {showChannelDropdown && (
                          <div className="absolute z-30 mt-1 w-full rounded-md bg-white dark:bg-gray-800 shadow-lg max-h-60 overflow-auto">
                            <div className="py-1">
                              <div 
                                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                onClick={() => {
                                  setSelectedChannelId('');
                                  setShowChannelDropdown(false);
                                }}
                              >
                                Select a channel
                              </div>
                              {channels.map(channel => (
                                <div 
                                  key={channel._id}
                                  className={`px-4 py-2 text-sm cursor-pointer ${
                                    selectedChannelId === channel._id
                                      ? "bg-blue-500 text-white"
                                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  }`}
                                  onClick={() => {
                                    setSelectedChannelId(channel._id);
                                    setShowChannelDropdown(false);
                                  }}
                                >
                                  {channel.channelName}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-yellow-600 dark:text-yellow-400">
                        No channels found in this workspace.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShareModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md"
              >
                Cancel
              </button>
              <button 
                onClick={handleShareSubmit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2"
                disabled={
                  (shareTarget === 'dm' && !selectedFriendId) || 
                  (shareTarget === 'channel' && (!selectedWorkspaceId || !selectedChannelId))
                }
              >
                <Send size={16} />
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodePlayground; 