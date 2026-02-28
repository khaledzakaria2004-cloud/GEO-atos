import React, { useState } from 'react';
import Icon from '../AppIcon';
import { exportChatData, importChatData, getChatConversations, cleanupOldConversations } from '../../utils/workoutStorage';

const ChatDataManager = () => {
  const [showManager, setShowManager] = useState(false);
  const [importData, setImportData] = useState('');

  const handleExport = () => {
    try {
      const data = exportChatData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atos-fit-chat-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error exporting chat data: ' + error.message);
    }
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importData);
      const success = importChatData(data);
      if (success) {
        alert('Chat data imported successfully!');
        setImportData('');
        setShowManager(false);
      } else {
        alert('Failed to import chat data');
      }
    } catch (error) {
      alert('Error importing chat data: ' + error.message);
    }
  };

  const handleCleanup = () => {
    try {
      const conversations = getChatConversations();
      if (conversations.length === 0) {
        alert('No conversations to clean up');
        return;
      }
      
      const keepCount = prompt(`You have ${conversations.length} conversations. How many recent conversations would you like to keep?`, '20');
      if (keepCount && !isNaN(keepCount)) {
        cleanupOldConversations(parseInt(keepCount));
        alert(`Cleaned up old conversations, kept ${keepCount} most recent ones`);
      }
    } catch (error) {
      alert('Error cleaning up conversations: ' + error.message);
    }
  };

  const getStats = () => {
    try {
      const conversations = getChatConversations();
      const totalMessages = conversations.reduce((sum, conv) => sum + conv.messageCount, 0);
      return { conversations: conversations.length, messages: totalMessages };
    } catch (error) {
      return { conversations: 0, messages: 0 };
    }
  };

  const stats = getStats();

  if (!showManager) {
    return (
      <button
        onClick={() => setShowManager(true)}
        className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
      >
        <Icon name="Database" size={16} />
        <span>Manage Chat Data</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Chat Data Manager</h3>
          <button
            onClick={() => setShowManager(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Stats */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium mb-2">Current Data</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Conversations:</span>
              <div className="font-semibold">{stats.conversations}</div>
            </div>
            <div>
              <span className="text-gray-600">Total Messages:</span>
              <div className="font-semibold">{stats.messages}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            <Icon name="Download" size={16} />
            <span>Export Chat Data</span>
          </button>

          <button
            onClick={handleCleanup}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
          >
            <Icon name="Trash2" size={16} />
            <span>Cleanup Old Conversations</span>
          </button>

          <div className="border-t pt-3">
            <h4 className="font-medium mb-2">Import Data</h4>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste exported JSON data here..."
              className="w-full h-32 p-2 border rounded text-sm"
            />
            <button
              onClick={handleImport}
              disabled={!importData.trim()}
              className="w-full mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Import Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatDataManager;