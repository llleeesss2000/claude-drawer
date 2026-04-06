const { spawn } = require('child_process');
const { EventEmitter } = require('events');

class SkillRunner extends EventEmitter {
  constructor() {
    super();
    this.pendingResume = null;
    this.resumeCallbacks = new Map();
  }

  async _runCommand(command, args, onProgress) {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      const proc = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });

      proc.stdout.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        onProgress({ type: 'stdout', data: chunk });
      });

      proc.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        onProgress({ type: 'stderr', data: chunk });
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });

      onProgress({ type: 'done', data: 'running' });
    });
  }

  async installSkill(skillName, onProgress) {
    try {
      await this._runCommand('npx', ['skills', 'add', skillName, '-y', '-g'], onProgress);
      onProgress({ type: 'done', data: '0' });
    } catch (err) {
      onProgress({ type: 'error', data: err.message });
      throw err;
    }
  }

  async removeSkill(skillName, onProgress) {
    try {
      await this._runCommand('npx', ['skills', 'remove', skillName, '-y', '-g'], onProgress);
      onProgress({ type: 'done', data: '0' });
    } catch (err) {
      onProgress({ type: 'error', data: err.message });
      throw err;
    }
  }

  async applyChanges(changes, onProgress) {
    const results = [];
    let paused = false;

    const resumeHandler = (action) => {
      if (this.pendingResume && typeof this.pendingResume === 'function') {
        this.pendingResume(action);
        this.pendingResume = null;
        paused = false;
      }
    };

    const waitUntilResumed = () => {
      return new Promise((resolve) => {
        paused = true;
        this.pendingResume = (action) => {
          resolve(action);
        };
      });
    };

    const processItem = async (item, action) => {
      onProgress({ type: 'start', item, action });

      let success = false;
      let error = null;

      try {
        if (action === 'install') {
          await this.installSkill(item, () => {}); // internal progress ignored for now
        } else {
          await this.removeSkill(item, () => {});
        }
        success = true;
      } catch (err) {
        error = err.message;
      }

      onProgress({ type: 'item-done', item, success, error });

      return { item, action, success, error };
    };

    const executeAll = async () => {
      const { install, remove } = changes;
      const items = [
        ...install.map((item) => ({ item, action: 'install' })),
        ...remove.map((item) => ({ item, action: 'remove' }))
      ];

      for (const { item, action } of items) {
        if (!paused) {
          const result = await processItem(item, action);
          results.push(result);

          if (!result.success) {
            const decision = await waitUntilResumed();
            if (decision === 'retry') {
              // re-try current item
              const retryResult = await processItem(item, action);
              results[results.length - 1] = retryResult;
              if (!retryResult.success) {
                onProgress({ type: 'all-done', results });
                return;
              }
            } else if (decision === 'rollback') {
              // rollback previously installed skills (reverse order)
              for (let i = results.length - 2; i >= 0; i--) {
                const res = results[i];
                if (res.action === 'install' && res.success) {
                  try {
                    await this.removeSkill(res.item, () => {});
                    res.success = false;
                    res.error = 'Rolled back';
                  } catch (e) {
                    // ignore rollback errors
                  }
                }
              }
              break;
            } else if (decision === 'skip') {
              // continue to next
              continue;
            }
          }
        }
      }

      onProgress({ type: 'all-done', results });
    };

    // Start execution
    executeAll();

    return {
      start: () => {
        // already started above
      },
      resume: (action) => {
        resumeHandler(action);
      }
    };
  }
}

const runner = new SkillRunner();

module.exports = {
  installSkill: (skillName, onProgress) => runner.installSkill(skillName, onProgress),
  removeSkill: (skillName, onProgress) => runner.removeSkill(skillName, onProgress),
  applyChanges: (changes, onProgress) => runner.applyChanges(changes, onProgress)
};