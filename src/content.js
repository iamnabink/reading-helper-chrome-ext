// Content script for Reading Helper - Auto Scroll
let scrollInterval = null;
let isScrolling = false;
let scrollSpeed = 50; // pixels per second
let scrollDirection = 'down'; // 'down' or 'up'

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startScroll') {
    startScrolling(request.speed, request.direction);
    sendResponse({ success: true });
  } else if (request.action === 'stopScroll') {
    stopScrolling();
    sendResponse({ success: true });
  } else if (request.action === 'getStatus') {
    sendResponse({ 
      isScrolling, 
      scrollSpeed, 
      scrollDirection 
    });
  } else if (request.action === 'updateSpeed') {
    scrollSpeed = request.speed;
    if (isScrolling) {
      stopScrolling();
      startScrolling(scrollSpeed, scrollDirection);
    }
    sendResponse({ success: true });
  } else if (request.action === 'updateDirection') {
    scrollDirection = request.direction;
    if (isScrolling) {
      stopScrolling();
      startScrolling(scrollSpeed, scrollDirection);
    }
    sendResponse({ success: true });
  }
  return true; // Keep message channel open for async response
});

function startScrolling(speed, direction) {
  if (isScrolling) {
    stopScrolling();
  }
  
  scrollSpeed = speed || scrollSpeed;
  scrollDirection = direction || scrollDirection;
  isScrolling = true;
  
  // Use requestAnimationFrame for smooth scrolling
  let lastTime = performance.now();
  let accumulatedScroll = 0; // Accumulate small scroll amounts for slow speeds
  const MIN_SCROLL_THRESHOLD = 0.5; // Minimum pixels to scroll at once
  
  function scrollStep(currentTime) {
    if (!isScrolling) return;
    
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // Calculate scroll amount based on time elapsed (pixels per second)
    const scrollAmount = (scrollSpeed / 1000) * deltaTime;
    
    // Accumulate scroll amount for very slow speeds
    if (scrollDirection === 'down') {
      accumulatedScroll += scrollAmount;
    } else {
      accumulatedScroll -= scrollAmount;
    }
    
    // Only scroll if accumulated amount reaches threshold
    if (Math.abs(accumulatedScroll) >= MIN_SCROLL_THRESHOLD) {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      
      if (scrollDirection === 'down') {
        if (currentScroll < maxScroll - 1) {
          const scrollToApply = Math.min(accumulatedScroll, maxScroll - currentScroll);
          const newScroll = currentScroll + scrollToApply;
          window.scrollTo(0, newScroll);
          accumulatedScroll -= scrollToApply; // Subtract what we actually scrolled
        } else {
          // Reached bottom, stop scrolling
          stopScrolling();
          return;
        }
      } else {
        // Scroll up
        if (currentScroll > 1) {
          const scrollToApply = Math.max(accumulatedScroll, -currentScroll);
          const newScroll = currentScroll + scrollToApply;
          window.scrollTo(0, newScroll);
          accumulatedScroll -= scrollToApply; // Subtract what we actually scrolled
        } else {
          // Reached top, stop scrolling
          stopScrolling();
          return;
        }
      }
    }
    
    scrollInterval = requestAnimationFrame(scrollStep);
  }
  
  scrollInterval = requestAnimationFrame(scrollStep);
}

function stopScrolling() {
  if (scrollInterval !== null) {
    cancelAnimationFrame(scrollInterval);
    scrollInterval = null;
  }
  isScrolling = false;
}

// Clean up when page unloads
window.addEventListener('beforeunload', () => {
  stopScrolling();
});

