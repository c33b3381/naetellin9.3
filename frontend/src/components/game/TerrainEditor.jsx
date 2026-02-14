import React, { useState, useCallback } from 'react';
import { Mountain, ArrowUp, ArrowDown, Minus, Route, Save, X, Circle, Navigation, Droplet } from 'lucide-react';

const TerrainEditor = ({ 
  isOpen, 
  onClose, 
  activeTool, 
  setActiveTool,
  brushSize,
  setBrushSize,
  brushStrength,
  setBrushStrength,
  onSaveTerrain,
  isSaving,
  pathNodes = [],
  onClearPath,
  onUndoPathNode
}) => {
  if (!isOpen) return null;

  const tools = [
    { id: 'raise', name: 'Raise', icon: ArrowUp, color: 'text-green-400', description: 'Raise terrain height' },
    { id: 'lower', name: 'Lower', icon: ArrowDown, color: 'text-red-400', description: 'Lower terrain height' },
    { id: 'flatten', name: 'Flatten', icon: Minus, color: 'text-yellow-400', description: 'Flatten to average height' },
    { id: 'road', name: 'Road', icon: Route, color: 'text-amber-600', description: 'Paint roads (flatten + color)' },
    { id: 'smooth', name: 'Smooth', icon: Circle, color: 'text-blue-400', description: 'Smooth terrain' },
    { id: 'water', name: 'Water', icon: Droplet, color: 'text-cyan-400', description: 'Paint water (flatten + blue color)' },
    { id: 'path', name: 'Path', icon: Navigation, color: 'text-purple-400', description: 'Place visible paths (click to add nodes)' },
  ];

  return (
    <div 
      className="fixed top-20 left-4 w-72 bg-gradient-to-b from-[#1a1614] to-[#0d0b0a] border-2 border-[#8b7355] rounded-lg shadow-2xl z-50"
      data-testid="terrain-editor-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#8b7355]/50 bg-gradient-to-r from-[#2a2320] to-[#1a1614]">
        <div className="flex items-center gap-2">
          <Mountain className="w-5 h-5 text-[#fbbf24]" />
          <h3 className="font-cinzel text-[#fbbf24] text-lg font-bold">Terrain Editor</h3>
        </div>
        <button 
          onClick={onClose}
          className="text-[#8b7355] hover:text-[#fbbf24] transition-colors"
          data-testid="terrain-editor-close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tools Grid */}
      <div className="p-4 space-y-4">
        <div>
          <h4 className="text-[#c9aa71] text-sm font-semibold mb-2">Tools</h4>
          <div className="grid grid-cols-3 gap-2">
            {tools.map(tool => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                    isActive 
                      ? 'bg-[#fbbf24]/20 border-[#fbbf24] shadow-lg shadow-[#fbbf24]/20' 
                      : 'bg-[#1a1614] border-[#8b7355]/30 hover:border-[#8b7355] hover:bg-[#2a2320]'
                  }`}
                  title={tool.description}
                  data-testid={`terrain-tool-${tool.id}`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#fbbf24]' : tool.color}`} />
                  <span className={`text-xs mt-1 ${isActive ? 'text-[#fbbf24]' : 'text-[#c9aa71]'}`}>
                    {tool.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Brush Size */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-[#c9aa71] text-sm font-semibold">Brush Size</h4>
            <span className="text-[#fbbf24] text-sm font-mono">{brushSize}</span>
          </div>
          <input
            type="range"
            min="5"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full h-2 bg-[#2a2320] rounded-lg appearance-none cursor-pointer accent-[#fbbf24]"
            data-testid="terrain-brush-size"
          />
          <div className="flex justify-between text-xs text-[#8b7355] mt-1">
            <span>Small</span>
            <span>Large</span>
          </div>
        </div>

        {/* Brush Strength */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-[#c9aa71] text-sm font-semibold">Brush Strength</h4>
            <span className="text-[#fbbf24] text-sm font-mono">{brushStrength.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={brushStrength}
            onChange={(e) => setBrushStrength(Number(e.target.value))}
            className="w-full h-2 bg-[#2a2320] rounded-lg appearance-none cursor-pointer accent-[#fbbf24]"
            data-testid="terrain-brush-strength"
          />
          <div className="flex justify-between text-xs text-[#8b7355] mt-1">
            <span>Gentle</span>
            <span>Strong</span>
          </div>
        </div>

        {/* Active Tool Info */}
        {activeTool && (
          <div className="bg-[#2a2320] rounded-lg p-3 border border-[#8b7355]/30">
            <p className="text-[#c9aa71] text-sm">
              <span className="text-[#fbbf24] font-semibold">
                {tools.find(t => t.id === activeTool)?.name}:
              </span>{' '}
              {tools.find(t => t.id === activeTool)?.description}
            </p>
            <p className="text-[#8b7355] text-xs mt-2">
              {activeTool === 'path' ? 'Click to place path nodes' : 'Click and drag on terrain to edit'}
            </p>
          </div>
        )}
        
        {/* Path Controls - Show when path tool is active */}
        {activeTool === 'path' && (
          <div className="bg-[#2a2320] rounded-lg p-3 border border-[#8b7355]/30 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[#c9aa71] text-sm">Path Nodes:</span>
              <span className="text-[#fbbf24] text-sm font-mono">{pathNodes.length}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onUndoPathNode}
                disabled={pathNodes.length === 0}
                className="flex-1 px-3 py-1.5 bg-[#1a1614] border border-[#8b7355]/50 rounded text-[#c9aa71] text-xs hover:bg-[#2a2320] hover:border-[#fbbf24] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Undo Last
              </button>
              <button
                onClick={onClearPath}
                disabled={pathNodes.length === 0}
                className="flex-1 px-3 py-1.5 bg-[#1a1614] border border-[#8b7355]/50 rounded text-red-400 text-xs hover:bg-[#2a2320] hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={onSaveTerrain}
          disabled={isSaving}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-cinzel font-bold transition-all ${
            isSaving
              ? 'bg-[#8b7355]/50 text-[#c9aa71] cursor-not-allowed'
              : 'bg-gradient-to-r from-[#fbbf24] to-[#d4a574] text-[#1a1614] hover:shadow-lg hover:shadow-[#fbbf24]/30'
          }`}
          data-testid="terrain-save-btn"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Terrain'}
        </button>

        {/* Instructions */}
        <div className="text-[#8b7355] text-xs space-y-1 pt-2 border-t border-[#8b7355]/30">
          <p>• <span className="text-[#c9aa71]">Left-click + drag</span> to edit terrain</p>
          <p>• <span className="text-[#c9aa71]">Scroll</span> to zoom camera</p>
          <p>• <span className="text-[#c9aa71]">F2</span> to toggle editor</p>
          <p>• Changes auto-save when you click Save</p>
        </div>
      </div>
    </div>
  );
};

export default TerrainEditor;
