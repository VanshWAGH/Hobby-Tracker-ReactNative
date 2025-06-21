module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': '.',  // Now '@/hooks' points to '/hooks' in root
        },
      },
    ],
  ],
};