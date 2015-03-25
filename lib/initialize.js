function initialize() {
  ImportJS.preload({
    baseUrl: 'js/',
    files: ['output/test.js'],
    libs: [
      'js/oops.min.js',
      'js/jquery-1.10.2.min.js',
      'js/qunit.js'
    ],
    strict: false,
    ready: function(arr) {
      var Main = ImportJS.unpack("com.mcleodgaming.elevator.Main");

      new Main();
    },
    error: function(arr) {
    }
  });
}