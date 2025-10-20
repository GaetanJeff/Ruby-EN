const Discord = require('discord.js');
const chalk = require('chalk');

module.exports = (client, node) => {
    try {
        console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), chalk.red(`Node`), chalk.green(`${node.options.identifier} is ready!`));
        
        // Vérifier si le nœud est réellement prêt
        if (node.stats) {
            console.log(chalk.blue(chalk.bold(`Stats`)), (chalk.white(`>>`)), chalk.green(`CPU: ${node.stats.cpu.lavalinkLoad.toFixed(2)}%`), chalk.white(`|`), chalk.green(`Memory: ${(node.stats.memory.used / 1024 / 1024).toFixed(2)}MB`));
        }
    } catch (error) {
        console.error('Error in nodeReady event:', error);
    }
}; 