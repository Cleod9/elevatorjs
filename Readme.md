# ElevatorJS #

----------

This is a sample application that was built with [AS3JS](https://github.com/Cleod9/as3js). It's an engine for an elevator simulator built with ActionScript 3.0 source code that executes in HTML5 without the Flash Player. For kicks I've included a Flash SWF just to demonstrate how easy it is to port. If you want to compile the Flash version yourself via the Flash IDE, you can grep the .as files for the text "For AS3" to find the code lines you'll need to modify.

[See Live Demo Here](http://as3js.org/examples/elevator)

## Initialization ##

The bulk of the setup for initializing the engine goes like this:

```javascript
var engine = new ElevatorEngine({
	entranceFloor: /* Reference to the entrance floor object */,
	elevators: [ /* Array of Elevator objects */ ],
	floors: [ /* Array of Floor objects */ ],
	people: [ /* Array of People objects */ ]
});

//Start the engine
engine.start();
```

You can explore the source code to see how to initialize the individual Floors, People, and Elevators. But please note this project is mainly designed for demonstration purposes, so there is little configuration required.

## To Perform a Build ##

With [Node.js](https://nodejs.org/) installed on your system, run `npm install` from within the project folder. Then execute this command:

`node node_modules/as3js/bin/as3jsc -src ./as3 -o elevator.js`

Open `elevator.htm` to view.

(You can install as3js as global module to save time, just ensure that it's version 0.1.0)

----------

Copyrighted © 2015 by Greg McLeod

GitHub: [https://github.com/cleod9](https://github.com/cleod9)