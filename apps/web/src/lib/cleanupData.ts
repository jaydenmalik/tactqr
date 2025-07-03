/**
 * Cleanup utility to remove old budget-related localStorage entries
 * This should be called after successful migration to tact
 */
export function cleanupLegacyData(): void {
  if (typeof localStorage === 'undefined') return;
  
  try {
    // List of old budget-related keys to remove
    const legacyKeys = [
      'budget_users',
      'budget_notes', 
      'budget_local_user_id',
      // Add any other budget-related keys here
    ];
    
    let removedCount = 0;
    
    // Remove legacy keys only if migration is complete
    const migrationDone = localStorage.getItem('tact_migration_done');
    if (migrationDone) {
      legacyKeys.forEach(key => {
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
          removedCount++;
        }
      });
      
      if (removedCount > 0) {
        console.log(`Cleaned up ${removedCount} legacy budget data entries`);
      }
    }
  } catch (error) {
    console.error('Failed to cleanup legacy data:', error);
  }
}

/**
 * Get a summary of current localStorage data
 */
export function getDataSummary(): Record<string, any> {
  if (typeof localStorage === 'undefined') return {};
  
  const summary: Record<string, any> = {};
  
  // Count tact data
  const tactUsers = localStorage.getItem('tact_users');
  const tactNotes = localStorage.getItem('tact_notes');
  const tactUserId = localStorage.getItem('tact_local_user_id');
  
  summary.tact = {
    users: tactUsers ? JSON.parse(tactUsers).length : 0,
    notes: tactNotes ? JSON.parse(tactNotes).length : 0,
    hasUserId: !!tactUserId,
    migrationDone: !!localStorage.getItem('tact_migration_done')
  };
  
  // Check for remaining legacy data
  const budgetUsers = localStorage.getItem('budget_users');
  const budgetNotes = localStorage.getItem('budget_notes');
  const budgetUserId = localStorage.getItem('budget_local_user_id');
  
  summary.legacy = {
    users: budgetUsers ? JSON.parse(budgetUsers).length : 0,
    notes: budgetNotes ? JSON.parse(budgetNotes).length : 0,
    hasUserId: !!budgetUserId
  };
  
  return summary;
} 