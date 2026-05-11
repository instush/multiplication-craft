import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import './App.css'

const COLS = 10   // multiplier 1..10
const ROWS = 10   // multiplicand 1..10
const TOTAL_CELLS = COLS * ROWS

const DIFFICULTY = {
  easy:   { seconds: 20, label: 'EASY',   color: 'var(--mc-emerald)' },
  medium: { seconds: 14, label: 'MEDIUM', color: 'var(--mc-gold)' },
  hard:   { seconds: 7,  label: 'HARD',   color: 'var(--mc-redstone)' },
}

function buildEmptyBoard() {
  // board[r-1][c-1] === true means filled
  return Array.from({ length: ROWS }, () => Array(COLS).fill(false))
}

function findEmptyCells(board) {
  const empties = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!board[r][c]) empties.push([r, c])
    }
  }
  return empties
}

function pickQuestion(board) {
  const empties = findEmptyCells(board)
  if (empties.length === 0) return null
  const [r, c] = empties[Math.floor(Math.random() * empties.length)]
  return (r + 1) * (c + 1)
}

function MenuScreen({ onStart }) {
  return (
    <div className="menu">
      <div className="menu-card mc-block bg-dirt">
        <div className="title-wrap">
          <h1 className="title">MULTI<span className="title-x">×</span>CRAFT</h1>
          <p className="subtitle">Mine the multiplication table!</p>
        </div>

        <div className="rules mc-block bg-stone">
          <h3>HOW TO PLAY</h3>
          <ul>
            <li>Drag the <span className="hl gold">glowing number</span> to the right cell.</li>
            <li>Correct? You earn <span className="hl emerald">1 point</span>.</li>
            <li>Wrong? The whole <span className="hl redstone">row &amp; column</span> get wiped!</li>
            <li>Fill every cell to <span className="hl diamond">WIN</span>.</li>
          </ul>
        </div>

        <div className="difficulty">
          <h3>PICK YOUR DIFFICULTY</h3>
          <div className="diff-buttons">
            {Object.entries(DIFFICULTY).map(([k, v]) => (
              <button
                key={k}
                className={`diff-btn diff-${k} mc-block`}
                onClick={() => onStart(k)}
              >
                <span className="diff-label">{v.label}</span>
                <span className="diff-time">{v.seconds}s</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function WinScreen({ score, difficulty, onRestart }) {
  return (
    <div className="menu">
      <div className="menu-card mc-block bg-dirt win-card">
        <div className="title-wrap">
          <h1 className="title">YOU WIN!</h1>
          <p className="subtitle">You crafted the whole table!</p>
        </div>
        <div className="win-stats mc-block bg-stone">
          <div className="stat">
            <span className="stat-label">FINAL SCORE</span>
            <span className="stat-value gold">{score}</span>
          </div>
          <div className="stat">
            <span className="stat-label">DIFFICULTY</span>
            <span className="stat-value">{DIFFICULTY[difficulty].label}</span>
          </div>
        </div>
        <button className="play-again mc-block bg-emerald" onClick={onRestart}>
          PLAY AGAIN
        </button>
      </div>
    </div>
  )
}

function Board({ board, validResult, onDrop, hoverCell, setHoverCell, dragging }) {
  return (
    <div className="board-wrap">
      <table className="board mc-block bg-stone">
        <thead>
          <tr>
            <th className="corner mc-block bg-dirt-dark">×</th>
            {Array.from({ length: COLS }, (_, c) => (
              <th key={c} className="header mc-block bg-wood">{c + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {board.map((row, r) => (
            <tr key={r}>
              <th className="header mc-block bg-wood">{r + 1}</th>
              {row.map((filled, c) => {
                const value = (r + 1) * (c + 1)
                const isHover = hoverCell && hoverCell[0] === r && hoverCell[1] === c
                return (
                  <td
                    key={c}
                    className={[
                      'cell mc-block',
                      filled ? 'bg-grass filled' : 'bg-cobble empty',
                      isHover ? 'hover' : '',
                      dragging && !filled ? 'targetable' : '',
                    ].join(' ')}
                    onDragOver={(e) => {
                      if (filled) return
                      e.preventDefault()
                      if (!isHover) setHoverCell([r, c])
                    }}
                    onDragLeave={() => {
                      if (isHover) setHoverCell(null)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      setHoverCell(null)
                      if (filled) return
                      onDrop(r, c)
                    }}
                  >
                    {filled ? value : ''}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function App() {
  const [gameState, setGameState] = useState('menu')   // 'menu' | 'playing' | 'won'
  const [difficulty, setDifficulty] = useState('easy')
  const [board, setBoard] = useState(buildEmptyBoard)
  const [currentResult, setCurrentResult] = useState(null)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [hoverCell, setHoverCell] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [flash, setFlash] = useState(null) // 'correct' | 'wrong' | 'timeout'
  const flashTimer = useRef(null)

  const startGame = (diff) => {
    const fresh = buildEmptyBoard()
    setDifficulty(diff)
    setBoard(fresh)
    setScore(0)
    setCurrentResult(pickQuestion(fresh))
    setTimeLeft(DIFFICULTY[diff].seconds)
    setGameState('playing')
    setFlash(null)
  }

  const nextQuestion = useCallback((nextBoard) => {
    const filledCount = nextBoard.reduce(
      (sum, row) => sum + row.filter(Boolean).length,
      0,
    )
    if (filledCount === TOTAL_CELLS) {
      setCurrentResult(null)
      setGameState('won')
      return
    }
    setCurrentResult(pickQuestion(nextBoard))
    setTimeLeft(DIFFICULTY[difficulty].seconds)
  }, [difficulty])

  const triggerFlash = (kind) => {
    setFlash(kind)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash(null), 450)
  }

  const handleDrop = (r, c) => {
    setDragging(false)
    if (board[r][c]) return
    const value = (r + 1) * (c + 1)
    if (value === currentResult) {
      const next = board.map((row, ri) =>
        ri === r ? row.map((v, ci) => (ci === c ? true : v)) : row,
      )
      setBoard(next)
      setScore((s) => s + 1)
      triggerFlash('correct')
      nextQuestion(next)
    } else {
      // wipe row r and column c
      const next = board.map((row, ri) =>
        row.map((v, ci) => {
          if (ri === r) return false
          if (ci === c) return false
          return v
        }),
      )
      setBoard(next)
      triggerFlash('wrong')
      nextQuestion(next)
    }
  }

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return
    if (timeLeft <= 0) {
      triggerFlash('timeout')
      nextQuestion(board)
      return
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 0.1), 100)
    return () => clearTimeout(id)
  }, [timeLeft, gameState, board, nextQuestion])

  const totalSeconds = DIFFICULTY[difficulty].seconds
  const timePct = Math.max(0, Math.min(100, (timeLeft / totalSeconds) * 100))
  const filledCount = useMemo(
    () => board.reduce((s, row) => s + row.filter(Boolean).length, 0),
    [board],
  )

  if (gameState === 'menu') return <MenuScreen onStart={startGame} />
  if (gameState === 'won')
    return (
      <WinScreen
        score={score}
        difficulty={difficulty}
        onRestart={() => setGameState('menu')}
      />
    )

  return (
    <div className={`game ${flash ? 'flash-' + flash : ''}`}>
      <div className="hud mc-block bg-dirt">
        <div className="hud-section">
          <span className="hud-label">SCORE</span>
          <span className="hud-value gold">{score}</span>
        </div>
        <div className="hud-section">
          <span className="hud-label">FILLED</span>
          <span className="hud-value diamond">{filledCount}/{TOTAL_CELLS}</span>
        </div>
        <div className="hud-section">
          <span className="hud-label">MODE</span>
          <span
            className="hud-value"
            style={{ color: DIFFICULTY[difficulty].color }}
          >
            {DIFFICULTY[difficulty].label}
          </span>
        </div>
        <div className="hud-section hud-timer">
          <span className="hud-label">TIME</span>
          <span className={`hud-value ${timeLeft < 2 ? 'redstone pulse' : ''}`}>
            {Math.max(0, timeLeft).toFixed(1)}s
          </span>
          <div className="time-bar mc-block bg-stone-dark">
            <div
              className="time-fill"
              style={{
                width: `${timePct}%`,
                background:
                  timePct > 50
                    ? '#39FF14'
                    : timePct > 25
                      ? '#FFE600'
                      : '#FF1744',
              }}
            />
          </div>
        </div>
        <button className="quit-btn mc-block bg-redstone" onClick={() => setGameState('menu')}>
          QUIT
        </button>
      </div>

      <div className="play-area">
        <div className="token-wrap">
          <div className="token-label">DRAG ME!</div>
          {currentResult !== null && (
            <div
              className={`token mc-block bg-diamond ${dragging ? 'is-dragging' : ''}`}
              draggable
              onDragStart={(e) => {
                setDragging(true)
                e.dataTransfer.effectAllowed = 'move'
                // Some browsers require data
                e.dataTransfer.setData('text/plain', String(currentResult))
              }}
              onDragEnd={() => {
                setDragging(false)
                setHoverCell(null)
              }}
            >
              <span className="token-eq">= ?</span>
              <span className="token-num">{currentResult}</span>
            </div>
          )}
          <div className="token-hint">
            Find the cell whose row × column = <b>{currentResult}</b>
          </div>
        </div>

        <Board
          board={board}
          validResult={currentResult}
          onDrop={handleDrop}
          hoverCell={hoverCell}
          setHoverCell={setHoverCell}
          dragging={dragging}
        />
      </div>
    </div>
  )
}

export default App
