function initialize() {
  ImportJS._settings.debug = true;
  ImportJS.preload({
    baseUrl: './',
    packages: ['elevator.js'],
    libs: [
      //'elevator.js', //<-This alternative is allowed since all packages have been combined into one file
      'lib/oops.min.js',
      'lib/jquery-1.10.2.min.js'
    ],
    strict: false,
    autoCompile: true,
    entryPoint: "com.mcleodgaming.elevator.Main:new"
  });
}