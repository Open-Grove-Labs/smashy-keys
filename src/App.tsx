import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [displayChar, setDisplayChar] = useState('')
  const [backgroundColor, setBackgroundColor] = useState('#ff6b6b')
  const [isCapsLock, setIsCapsLock] = useState(false)

  // Predefined bright colors for letters and numbers
  const getCharColor = (char: string): string => {
    const colors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
      '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
      '#feca57', '#48dbfb', '#0abde3', '#006ba6', '#f0932b',
      '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8', '#fdcb6e',
      '#e17055', '#81ecec', '#74b9ff', '#00cec9', '#55a3ff',
      '#ff7675', '#fd79a8', '#a29bfe', '#6c5ce7', '#00b894',
      '#00cec9', '#0984e3', '#6c5ce7', '#e84393', '#fd79a8',
      '#fdcb6e'
    ]
    
    if (char >= '0' && char <= '9') {
      return colors[char.charCodeAt(0) - '0'.charCodeAt(0)]
    }
    
    // Handle both lowercase and uppercase letters using the same color mapping
    if (char >= 'a' && char <= 'z') {
      return colors[10 + (char.charCodeAt(0) - 'a'.charCodeAt(0))]
    }
    
    if (char >= 'A' && char <= 'Z') {
      return colors[10 + (char.charCodeAt(0) - 'A'.charCodeAt(0))]
    }
    
    return '#ffffff'
  }

  // Generate random bright background colors
  const getRandomBackgroundColor = (): string => {
    const backgroundColors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
      '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
      '#48dbfb', '#0abde3', '#f0932b', '#eb4d4b', '#6c5ce7',
      '#fd79a8', '#fdcb6e', '#e17055', '#81ecec', '#74b9ff',
      '#00cec9', '#55a3ff', '#ff7675', '#a29bfe', '#00b894'
    ]
    return backgroundColors[Math.floor(Math.random() * backgroundColors.length)]
  }

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key
      
      // Update Caps Lock state
      setIsCapsLock(event.getModifierState('CapsLock'))
      
      // Change background color for every keypress
      setBackgroundColor(getRandomBackgroundColor())
      
      // Handle letters and numbers
      if (/^[a-zA-Z0-9]$/.test(key)) {
        // For letters, use the actual case based on Caps Lock and Shift
        if (/^[a-zA-Z]$/.test(key)) {
          // Check if Caps Lock is on
          const capsLockOn = event.getModifierState('CapsLock')
          const shiftPressed = event.shiftKey
          
          // Determine if letter should be uppercase
          const shouldBeUppercase = capsLockOn !== shiftPressed // XOR logic
          
          setDisplayChar(shouldBeUppercase ? key.toUpperCase() : key.toLowerCase())
        } else {
          // For numbers, always show as-is
          setDisplayChar(key)
        }
      }
      // Handle arrow keys
      else if (key === 'ArrowUp') {
        setDisplayChar('UP')
      }
      else if (key === 'ArrowDown') {
        setDisplayChar('DOWN')
      }
      else if (key === 'ArrowLeft') {
        setDisplayChar('LEFT')
      }
      else if (key === 'ArrowRight') {
        setDisplayChar('RIGHT')
      }
      // Clear display for other keys
      else {
        setDisplayChar('')
      }
    }

    // Add event listeners
    window.addEventListener('keydown', handleKeyPress)
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [])

  return (
    <div 
      className="toddler-app"
      style={{ '--bg-color': backgroundColor } as React.CSSProperties}
    >
      <div className="display-container">
        {displayChar && (
          <div 
            className="display-char"
            style={{ '--char-color': /^[a-zA-Z0-9]$/.test(displayChar) ? getCharColor(displayChar) : '#ffffff' } as React.CSSProperties}
          >
            {displayChar}
          </div>
        )}
      </div>
      {!displayChar && (
        <div className="instructions">
          <h1>Press any key!</h1>
          <p>Letters, numbers, or arrow keys</p>
          <p className="caps-lock-hint">
            Use Caps Lock for UPPERCASE letters!
          </p>
        </div>
      )}
    </div>
  )
}

export default App
