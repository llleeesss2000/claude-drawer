const CONFLICT_RULES = [
  { type: 'duplicate-function', items: ['pdf-reader', 'pdf-extractor'], message: '兩個套件都能處理 PDF，可能造成重複' },
  { type: 'incompatible', items: ['old-auth', 'new-auth'], message: '這兩個套件已知不相容' }
];

function detectConflicts(installedSkills, installedMcps) {
  const conflicts = [];
  
  // 檢查 skill 衝突
  for (const rule of CONFLICT_RULES) {
    if (rule.type === 'duplicate-function' || rule.type === 'incompatible') {
      const matchedItems = rule.items.filter(item => installedSkills.includes(item));
      if (matchedItems.length >= 2) {
        conflicts.push({
          type: rule.type,
          items: matchedItems,
          message: rule.message,
          level: rule.type === 'incompatible' ? 'error' : 'warning'
        });
      }
    }
  }
  
  // 檢查 MCP port 衝突（需額外 MCP 資訊，此處以簡化方式處理：若有多個 MCP 則視為潛在 port 衝突）
  if (installedMcps.length > 1) {
    conflicts.push({
      type: 'port-conflict',
      items: installedMcps,
      message: '多個 MCP 套件可能爭用相同 port',
      level: 'warning'
    });
  }
  
  return conflicts;
}

function checkBeforeInstall(newSkillName, existingSkills) {
  const conflicts = [];
  
  for (const rule of CONFLICT_RULES) {
    if (rule.type === 'duplicate-function' || rule.type === 'incompatible') {
      const matchedItems = [...rule.items].filter(item => item === newSkillName || existingSkills.includes(item));
      if (matchedItems.length >= 2) {
        conflicts.push({
          type: rule.type,
          items: matchedItems,
          message: rule.message,
          level: rule.type === 'incompatible' ? 'error' : 'warning'
        });
      }
    }
  }
  
  return conflicts;
}

module.exports = {
  CONFLICT_RULES,
  detectConflicts,
  checkBeforeInstall
};