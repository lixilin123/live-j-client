/**
 * 该文件汇总了所有常用的js方法
 */
const formatVipEndTime = timestamp => new Date(timestamp * 1000).toLocaleDateString().replace(/\//g, '-');

export {formatVipEndTime}