process.env['CONFIG_ENCRYPTION_KEY'] = 'dae16029d2cf61843ca259b1de31963877f849ee5420c0c019906da29601c2fb';

module.exports = {
    testTimeout: 10000,
    testEnvironment: 'node',
    coveragePathIgnorePatterns: ['utils/', 'conf/']
};