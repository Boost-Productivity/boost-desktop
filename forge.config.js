const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    appBundleId: 'com.boost-productivity.todo',
    appCategoryType: 'public.app-category.productivity',
    osxSign: false,
    osxNotarize: false,
    // Only include necessary files for the application
    ignore: [
      /node_modules\/(.*)\.map/,
      /node_modules\/(.*)\.md/,
      /node_modules\/(.*)\/test.*/,
      /node_modules\/(.*)\/docs.*/,
      /node_modules\/(.*)\/examples.*/,
      /\.git.*/,
      /\.vscode.*/,
      /\.github.*/,
      /\.idea.*/,
      /.*\.log/
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32', 'linux']
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        name: 'Boost Todo'
      }
    },
    {
      name: '@electron-forge/maker-deb',
      config: {}
    }
    // Commented out until rpmbuild is installed
    // {
    //   name: '@electron-forge/maker-rpm',
    //   config: {}
    // }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {}
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true
    })
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'Boost-Productivity',
          name: 'boost-desktop'
        },
        prerelease: false
      }
    }
  ]
};
