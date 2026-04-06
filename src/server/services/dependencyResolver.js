const DEPENDENCY_MAP = {
  'advanced-git': ['filesystem'],
  'code-review': ['eslint', 'typescript'],
  'data-viz': ['csv-reader']
};

function resolveDependencies(skillNames) {
  const resolved = [...skillNames];
  const added = [];
  const messages = [];
  const queue = [...skillNames];
  const visited = new Set(skillNames);

  while (queue.length > 0) {
    const currentSkill = queue.shift();
    const deps = DEPENDENCY_MAP[currentSkill] || [];

    for (const dep of deps) {
      if (!visited.has(dep)) {
        visited.add(dep);
        resolved.push(dep);
        added.push(dep);
        messages.push(`安裝 ${currentSkill} 需要同時安裝 ${dep}，已自動幫您勾選`);
        queue.push(dep);
      }
    }
  }

  return {
    resolved,
    added,
    messages
  };
}

function getDependencies(skillName) {
  return DEPENDENCY_MAP[skillName] || [];
}

module.exports = {
  DEPENDENCY_MAP,
  resolveDependencies,
  getDependencies
};