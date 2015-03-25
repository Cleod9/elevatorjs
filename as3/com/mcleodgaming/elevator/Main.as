package com.mcleodgaming.elevator
{
	import com.mcleodgaming.elevator.util.*;
	import com.mcleodgaming.elevator.core.*;
	import com.mcleodgaming.elevator.views.*;
	import com.mcleodgaming.elevator.events.*;
	import flash.display.MovieClip;
	import flash.utils.*;

	//Initializes the elevator project
	public class Main // extends MovieClip /*For AS3*/
	{
		public static var ROOT:Main = null; //A reference to the non-static instance (not exactly necessary, but used in the ElevatorView)
		public static var FPS:int = 30; //Tick frame rate
		public static function eventHelper(context, fn):* {
			//Helps with binding events to 'this'
			return function (e) {
				return fn.call(context, e);
			};
		}

		public var engine:ElevatorEngine; //Reference to the running engine
		public var view:ElevatorView; //Reference to the attached view
		public var addingPeople:Boolean; //Toggle to determine if people adding timer is on or off
		public var addPeopleInterval:*; //Reference to the people adding timer
		
		public function Main():void {
			Debug.init();
			Debug.log("Main class created.");

			//Some simple inits
			Main.ROOT = this;
			EventDispatcher.init();

			//Create floors, elevators, and people
			var floors = ElevatorEngine.generateFloors(10);
			var elevators = ElevatorEngine.generateElevators(5, floors, floors[0], floors[0]);
			var people = ElevatorEngine.generatePeople(4, floors, floors[0], floors[0]);
			
			//Create the engine
			engine = new ElevatorEngine({
				entranceFloor: floors[0],
				elevators: elevators,
				floors: floors,
				people: people
			});

			//Start the engine
			engine.start();

			//Start the people adding timer
			startAddingPeople();

			//Attach a view so we can visualize
			//view = new ElevatorView(engine); //For template version (no
			//view = new ElevatorViewAS3(engine); //For AS3 Version
			view = new ElevatorViewJS(engine); //For JS Version
		}
		public function addPeople(e:* = null):void {
			//Add a random amount of people to the elevator engine
			var people = ElevatorEngine.generatePeople(Math.round(Math.random()*(5-1) + 1), engine.floors, engine.floors[0], engine.floors[0]);
			for(var i = 0; i < people.length; i++)
				engine.addPerson(people[i]);
		}
		public function startAddingPeople():void {
			if(!addingPeople) {
				//Turn on the people adding timer
				addingPeople = true;
				addPeopleInterval = setInterval(Main.eventHelper(this, addPeople), 5000);
				Debug.log("Started adding people.")
			} else {
				Debug.log("Already adding people.")
			}
		}
		public function stopAddingPeople():void {
			if(addingPeople) {
				//Turn off the people adding timer
				addingPeople = false;
				clearInterval(addPeopleInterval);
				Debug.log("Stopped adding people.")
			} else {
				Debug.log("Not currently adding people.")
			}
		}
	}
}