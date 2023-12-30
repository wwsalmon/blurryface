module.exports = {
    content: ["./**/*.html"],
    theme: {
      extend: {
        colors: {
            cream: "#FFF5EE",
            accent: "#FED933",
        }
      },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
  }