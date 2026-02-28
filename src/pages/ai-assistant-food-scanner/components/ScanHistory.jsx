import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ScanHistory = ({ history = [], onReanalyze, onClearHistory, onDeleteItem, onRenameItem }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);

  const formatDate = (date) => {
    return new Date(date)?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRenameClick = (scan) => {
    setEditingId(scan.id);
    setEditName(scan.name || '');
    setMenuOpenId(null);
  };

  const handleRenameSubmit = (scan) => {
    if (editName.trim() && onRenameItem) {
      onRenameItem(scan.id, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  const handleDeleteClick = (scanId) => {
    setShowDeleteConfirm(scanId);
    setMenuOpenId(null);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm && onDeleteItem) {
      onDeleteItem(showDeleteConfirm);
    }
    setShowDeleteConfirm(null);
  };

  if (history?.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="History" size={24} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No Scan History</h3>
        <p className="text-sm text-muted-foreground">
          Your food scans will appear here for quick access
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Recent Scans</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearHistory}
          iconName="Trash2"
          iconPosition="left"
          className="text-muted-foreground hover:text-destructive"
        >
          Clear All
        </Button>
      </div>

      {/* History Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {history?.slice(0, 6)?.map((scan, index) => (
          <div
            key={scan?.id || index}
            className="bg-card border border-border rounded-xl p-4 hover:shadow-elevation-2 transition-shadow relative"
          >
            {/* Options Menu Button */}
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === scan.id ? null : scan.id);
                }}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
              >
                <Icon name="MoreVertical" size={16} className="text-muted-foreground" />
              </button>
              
              {/* Dropdown Menu */}
              {menuOpenId === scan.id && (
                <div className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-lg py-1 min-w-32 z-20">
                  <button
                    onClick={() => handleRenameClick(scan)}
                    className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-muted transition-colors text-sm"
                  >
                    <Icon name="Edit2" size={14} />
                    <span>Rename</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(scan.id)}
                    className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-destructive/10 text-destructive transition-colors text-sm"
                  >
                    <Icon name="Trash2" size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>

            {/* Scan Image */}
            <div className="w-full h-32 bg-muted rounded-lg mb-3 overflow-hidden">
              {scan?.image ? (
                <img 
                  src={scan?.image} 
                  alt={scan?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon name="Image" size={24} className="text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Scan Info */}
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                {editingId === scan.id ? (
                  <div className="flex items-center space-x-2 flex-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubmit(scan);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRenameSubmit(scan)}
                      className="p-1 hover:bg-success/10 text-success rounded"
                    >
                      <Icon name="Check" size={14} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <Icon name="X" size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <h4 className="font-medium text-card-foreground text-sm truncate">
                      {scan?.name || 'Unknown Food'}
                    </h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {formatDate(scan?.timestamp)}
                    </span>
                  </>
                )}
              </div>

              {/* Quick Stats */}
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Icon name="Flame" size={12} />
                  <span>{scan?.calories || 0} cal</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Icon name="Beef" size={12} />
                  <span>{scan?.protein || 0}g</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Icon name="Wheat" size={12} />
                  <span>{scan?.carbohydrates || 0}g</span>
                </div>
              </div>

              {/* Scan Type Badge */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  scan?.scanType === 'qr' ?'bg-success/10 text-success' :'bg-primary/10 text-primary'
                }`}>
                  <Icon 
                    name={scan?.scanType === 'qr' ? 'QrCode' : 'Camera'} 
                    size={10} 
                    className="mr-1"
                  />
                  {scan?.scanType === 'qr' ? 'QR Scan' : 'Food Scan'}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReanalyze(scan)}
                  className="text-xs h-6 px-2"
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {history?.length > 6 && (
        <div className="text-center">
          <Button variant="outline" size="sm">
            View All History ({history?.length} scans)
          </Button>
        </div>
      )}

      {/* Quick Stats Summary */}
      <div className="bg-muted rounded-xl p-4">
        <h4 className="font-medium text-foreground mb-3">Today's Summary</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {history?.reduce((sum, scan) => sum + (scan?.calories || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Calories</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-success">
              {history?.length}
            </p>
            <p className="text-xs text-muted-foreground">Foods Scanned</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-warning">
              {history?.reduce((sum, scan) => sum + (scan?.protein || 0), 0)}g
            </p>
            <p className="text-xs text-muted-foreground">Total Protein</p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              Delete Food Log
            </h3>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete this food log? This action cannot be undone.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanHistory;
