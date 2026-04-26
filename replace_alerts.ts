import fs from 'fs';

const filepath = 'src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(filepath, 'utf8');

content = content.replace(/alert\(/g, 'showToast(');

// Add state and showToast function
const stateHook = `  const [activeTab, setActiveTab] = useState('overview');`;
const toastHook = `  const [activeTab, setActiveTab] = useState('overview');
  const [toastMessage, setToastMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };`;
content = content.replace(stateHook, toastHook);

// Add Toast UI
const uiEnd = `    </div>
  );
}`;
const toastUI = `      {/* Toast Notification */}
      {toastMessage && (
        <div className={\`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 transition-all duration-300 \${toastMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'}\`}>
          {toastMessage.text}
        </div>
      )}
    </div>
  );
}`;
content = content.replace(uiEnd, toastUI);

fs.writeFileSync(filepath, content);
console.log('Replaced alerts with showToast');
