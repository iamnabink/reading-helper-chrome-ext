import { useState, useEffect, useRef } from 'react';
import './styles.css';

function App() {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(50);
  const [scrollDirection, setScrollDirection] = useState('down');
  
  // Use refs to always have the latest values (prevents stale closures)
  const scrollSpeedRef = useRef(50);
  const scrollDirectionRef = useRef('down');
  
  // Keep refs in sync with state
  useEffect(() => {
    scrollSpeedRef.current = scrollSpeed;
  }, [scrollSpeed]);
  
  useEffect(() => {
    scrollDirectionRef.current = scrollDirection;
  }, [scrollDirection]);

  // Get current tab and check status
  useEffect(() => {
    checkStatus();
  }, []);

  const injectContentScript = async (tabId) => {
    try {
      // Check if we can inject scripts on this page
      const tab = await chrome.tabs.get(tabId);
      if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')) {
        throw new Error('Cannot inject scripts on this page type');
      }
      
      // Try to inject the content script
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
      return true;
    } catch (error) {
      // Script might already be injected, or page might not allow injection
      console.log('Content script injection result:', error.message);
      return false;
    }
  };

  const checkStatus = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        // Try to get status (will auto-inject if needed, but don't retry on error for status check)
        chrome.tabs.sendMessage(tab.id, { action: 'getStatus' }, (response) => {
          if (chrome.runtime.lastError) {
            // Script not injected yet, that's okay - just use defaults
            console.log('Status check: script not ready yet');
            return;
          }
          if (response) {
            setIsScrolling(response.isScrolling || false);
            setScrollSpeed(response.scrollSpeed || 50);
            setScrollDirection(response.scrollDirection || 'down');
          }
        });
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const sendMessageWithRetry = async (tabId, message, retry = true) => {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          if (retry) {
            // Script might not be injected yet, try injecting first
            injectContentScript(tabId).then((injected) => {
              if (injected) {
                // Wait a bit for script to initialize
                setTimeout(() => {
                  chrome.tabs.sendMessage(tabId, message, (retryResponse) => {
                    if (chrome.runtime.lastError) {
                      reject(new Error(chrome.runtime.lastError.message));
                    } else {
                      resolve(retryResponse);
                    }
                  });
                }, 150);
              } else {
                reject(new Error('Could not inject content script'));
              }
            });
          } else {
            reject(new Error(chrome.runtime.lastError.message));
          }
        } else {
          resolve(response);
        }
      });
    });
  };

  const handleStartScroll = async () => {
    // Prevent double-clicks
    if (isScrolling) {
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        alert('Error: Could not access the current tab.');
        return;
      }

      // Check if page is injectable
      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://'))) {
        alert('Error: Cannot scroll on this page type (chrome://, extension pages, etc.). Please open a regular webpage.');
        return;
      }

      // Use refs to get the latest values (prevents stale closures)
      const currentSpeed = scrollSpeedRef.current;
      const currentDirection = scrollDirectionRef.current;

      // Try to send message (will auto-inject if needed)
      const response = await sendMessageWithRetry(tab.id, {
        action: 'startScroll',
        speed: currentSpeed,
        direction: currentDirection
      });
      
      if (response) {
        setIsScrolling(true);
      }
    } catch (error) {
      console.error('Error starting scroll:', error);
      alert('Error: Could not start scrolling. Please refresh the page and try again.');
    }
  };

  const handleStopScroll = async () => {
    // Prevent double-clicks
    if (!isScrolling) {
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        // Try to send message (will auto-inject if needed)
        try {
          await sendMessageWithRetry(tab.id, { action: 'stopScroll' });
          setIsScrolling(false);
        } catch (error) {
          console.error('Error stopping scroll:', error);
          // Still set state to false even if error
          setIsScrolling(false);
        }
      }
    } catch (error) {
      console.error('Error stopping scroll:', error);
      setIsScrolling(false);
    }
  };

  const handleSpeedChange = (e) => {
    const newSpeed = parseInt(e.target.value) || 50;
    
    // Update state immediately
    setScrollSpeed(newSpeed);
    scrollSpeedRef.current = newSpeed; // Update ref immediately too
    
    // Update speed in real-time if scrolling
    if (isScrolling) {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs[0]?.id) {
          try {
            await injectContentScript(tabs[0].id);
            setTimeout(() => {
              chrome.tabs.sendMessage(tabs[0].id, { action: 'updateSpeed', speed: newSpeed }, (response) => {
                if (chrome.runtime.lastError) {
                  console.error('Error updating speed:', chrome.runtime.lastError.message);
                }
              });
            }, 50);
          } catch (error) {
            console.error('Error updating speed:', error);
          }
        }
      });
    }
  };

  const handleDirectionChange = (direction) => {
    // Update state immediately
    setScrollDirection(direction);
    scrollDirectionRef.current = direction; // Update ref immediately too
    
    // Update direction in real-time if scrolling
    if (isScrolling) {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs[0]?.id) {
          try {
            await injectContentScript(tabs[0].id);
            setTimeout(() => {
              chrome.tabs.sendMessage(tabs[0].id, { action: 'updateDirection', direction }, (response) => {
                if (chrome.runtime.lastError) {
                  console.error('Error updating direction:', chrome.runtime.lastError.message);
                }
              });
            }, 50);
          } catch (error) {
            console.error('Error updating direction:', error);
          }
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-4 px-3">
      <div className="w-full max-w-md space-y-4 bg-white rounded-lg shadow-lg p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Reading Helper</h1>
          <p className="text-xs text-gray-600 mb-3">Auto Scroll for Long Articles</p>
        </div>
        
        {/* Scroll Speed Control */}
        <div className="border-b border-gray-200 pb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Scroll Speed: {scrollSpeed} px/s
              </label>
                <input
            type="range"
            min="10"
            max="200"
            value={scrollSpeed}
            onChange={handleSpeedChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((scrollSpeed - 10) / 190) * 100}%, #e5e7eb ${((scrollSpeed - 10) / 190) * 100}%, #e5e7eb 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Slow</span>
            <span>Fast</span>
            </div>
          </div>
          
        {/* Scroll Direction */}
        <div className="border-b border-gray-200 pb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Scroll Direction
            </label>
          <div className="flex gap-2">
            <button 
              onClick={() => handleDirectionChange('down')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
                scrollDirection === 'down'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ⬇️ Down
            </button>
              <button 
              onClick={() => handleDirectionChange('up')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
                scrollDirection === 'up'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ⬆️ Up
              </button>
            </div>
        </div>

        {/* Start/Stop Button */}
        <div className="pt-2">
          {!isScrolling ? (
            <button
              onClick={handleStartScroll}
              className="w-full px-4 py-3 text-sm font-medium bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              ▶️ Start Scrolling
            </button>
          ) : (
              <button 
              onClick={handleStopScroll}
              className="w-full px-4 py-3 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
              ⏸️ Stop Scrolling
              </button>
          )}
        </div>

        {/* Status Indicator */}
        <div className="pt-2">
          <div className={`text-center text-xs font-medium ${
            isScrolling ? 'text-green-600' : 'text-gray-500'
          }`}>
            {isScrolling ? (
              <span>🟢 Scrolling {scrollDirection === 'down' ? 'down' : 'up'} at {scrollSpeed} px/s</span>
            ) : (
              <span>⚪ Not scrolling</span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            💡 Tip: Adjust speed and direction while scrolling. The page will automatically stop at the top or bottom.
          </p>
        </div>

        {/* Developer Info */}
        <div className="pt-2 border-t border-gray-100">
          <div className="text-center space-y-1">
            <p className="text-[10px] text-gray-500">
              Built with <span className="text-red-500">❤️</span> by <span className="font-semibold text-gray-700">Nabraj Khadka</span>
            </p>
            <div className="flex flex-wrap justify-center items-center gap-2 text-[9px]">
              <a 
                href="https://github.com/iamnabink" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-0.5"
              >
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
              <a 
                href="https://www.linkedin.com/in/iamnabink/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-0.5"
              >
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
              <a 
                href="https://nabrajkhadka.com.np/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-0.5"
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                Website
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
