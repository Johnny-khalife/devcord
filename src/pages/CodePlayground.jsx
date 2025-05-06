import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Play, X, Maximize2, Minimize2, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import '../styles/CodePlayground.css';

// Import CodeMirror components
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';

const CodePlayground = () => {
  const navigate = useNavigate();
  
  // Initial code states
  const initialHtmlCode = '<!-- Enter HTML here -->\n<h1>Welcome to Devcord!</h1>\n<p>Start coding to see the preview</p>';
  const initialCssCode = '/* Enter CSS here */\nbody {\n  font-family: system-ui, sans-serif;\n  color: #333;\n  padding: 2rem;\n}\n\nh1 {\n  color: #2563eb;\n}';
  const initialJsCode = '// Enter JavaScript here\nconsole.log("Hello from Devcord Code Playground!");\n\n// Example: Add a click event\ndocument.addEventListener("DOMContentLoaded", () => {\n  const heading = document.querySelector("h1");\n  if (heading) {\n    heading.addEventListener("click", () => {\n      heading.style.color = "#" + Math.floor(Math.random()*16777215).toString(16);\n    });\n  }\n});';
  
  // State for code editors
  const [htmlCode, setHtmlCode] = useState(initialHtmlCode);
  const [cssCode, setCssCode] = useState(initialCssCode);
  const [jsCode, setJsCode] = useState(initialJsCode);
  
  // State for preview
  const [previewCode, setPreviewCode] = useState('');
  
  // State for share modal
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState('channel');
  
  // State for editor expansion
  const [expandedEditor, setExpandedEditor] = useState(null);
  const [collapsedEditors, setCollapsedEditors] = useState({
    html: false,
    css: false,
    js: false
  });

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
  
  // Generate full HTML document for preview
  const generateDocument = () => {
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
  const handleShareSubmit = () => {
    console.log(`Sharing code snippet to ${shareTarget}`);
    console.log({
      html: htmlCode,
      css: cssCode,
      js: jsCode
    });
    setShareModalOpen(false);
  };

  // Handle reset button click
  const handleReset = () => {
    setHtmlCode(initialHtmlCode);
    setCssCode(initialCssCode);
    setJsCode(initialJsCode);
    setPreviewCode('');
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
  
  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 p-4 code-playground-container">
      <header className="flex justify-between items-center mb-4 pt-2">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Code Playground</h1>
        <button 
          onClick={() => navigate(-1)} 
          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-200"
        >
          Back
        </button>
      </header>
      
      <div className={`flex flex-col lg:grid lg:grid-cols-2 gap-4 flex-grow ${expandedEditor ? 'hidden' : ''}`}>
        {/* Editors Section */}
        <div className="flex flex-col gap-4">
          {/* Instructions */}
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 hidden md:block">
            <span><ChevronUp size={14} className="inline" /> Collapse | </span>
            <span><Maximize2 size={14} className="inline" /> Expand an editor for better visibility</span>
          </div>
          
          {/* HTML Editor */}
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
          
          {/* CSS Editor */}
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
          
          {/* JavaScript Editor */}
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
          
          <div className="flex gap-2">
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
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full modal-content">
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
                onChange={(e) => setShareTarget(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="channel">Send to Channel</option>
                <option value="dm">Send to DM</option>
              </select>
            </div>
            
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