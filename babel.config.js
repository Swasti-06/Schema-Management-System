export default {
    presets: [
      [
        "@babel/preset-env",
        {
          targets: { node: "current" }, // transpile for your current Node
        },
      ],
    ],
  };
  