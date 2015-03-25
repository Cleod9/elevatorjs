package com.mcleodgaming.elevator.views
{
	import com.mcleodgaming.elevator.core.*;
	import com.mcleodgaming.elevator.events.*;
	import com.mcleodgaming.elevator.util.*;
	import com.mcleodgaming.elevator.Main;

	public class ElevatorViewJS extends ElevatorView
	{
		public var pauseToggle:Boolean;
		public var elevatorTable:*;
		public var elevatorRow:*;
		public var elevatorColumns:*;
		public var floorTable:*;

		public function ElevatorViewJS(e:ElevatorEngine):void {
			super(e);
			var i;
			var self = this;
			engine = e;

			//Create table elements
			elevatorTable = $('.elevator-view tbody');
			elevatorRow = $('<tr/>'); //Store this for easy direct reference to rows
			elevatorColumns = []; //Will place the columns to display elevators in here
			elevatorTable.append(elevatorRow); //Add the row to the elevator table

			//Build floor table
			floorTable = $('.floor-view');
			for(i = engine.floors.length - 1; i >= 0; i--) {
				floorTable.append('<tr><td class="title">Floor ' + engine.floors[i].name + ':</td><td class="data"></td></tr>')
			}

			//Make pause button to start/stop the engine and people adding timer
			pauseToggle = $('.btn-pause');
			pauseToggle.click(function() {
				$('.btn-pause').toggleClass('paused');

				if($('.btn-pause').hasClass('paused')) {
					$('.btn-pause').text('Play');
					Main.ROOT.stopAddingPeople();
					self.engine.stop();
				} else {
					$('.btn-pause').text('Pause');
					self.engine.start();
					Main.ROOT.startAddingPeople();
				}
			});


			//Add elevator elements
			for(i = 0; i < engine.elevators.length; i++) {
				var col = $('<td/>').append($('<div/>').addClass('elevator'));
				elevatorColumns.push(col);
				elevatorRow.append(col);
			}
      
			//Ready to accept events
			EventDispatcher.dispatcher.addEventListener(ElevatorEngineEvent.UPDATE, Main.eventHelper(this, onUpdate));

			Debug.log('Initialized ElevatorView');
		}
		public override function onUpdate(event:ElevatorEngineEvent):void {
			var i, j;
			//For each floor (Floor Table View)
			for(i = 0; i < engine.floors.length; i++) {
				$('tr', floorTable).eq(engine.floors.length - i - 1).find('.data').text('');
				//For each person on this floor
				for(j = 0; j < engine.floors[i].people.length; j++) {
					var prepend = (j > 0) ? ", " : "";
					if(engine.queue.indexOf(engine.floors[i].people[j]) >= 0)
						prepend += "*"; //Button press yet to be acknowledged
					else if(engine.floors[i].people[j].state == PersonState.LEAVING || engine.floors[i].people[j].state == PersonState.ENTERING)
						prepend += "+"; //Some elevator has responded to their button press
					//Concatenate all of the people (placing in the table from the bottom up)
					$('tr', floorTable).eq(engine.floors.length - i - 1).find('.data').append(prepend + engine.floors[i].people[j].name + '(' + engine.floors[i].people[j].targetFloor.name + ')');
				}
			}
			//Render elevators (Elevator View)
			for(i = 0; i < engine.elevators.length; i++) {
				var height = (elevatorColumns[i].height() / elevatorTable.height() * 84); //<-Weird guessing to get the elevators to fit in the window
				var offset = (engine.elevators[i].currentFloor.index / engine.floors.length * height);
				elevatorColumns[i].find('.elevator').css('bottom', Math.round(offset) + '%').html(getInfo(engine.elevators[i])); //<-TODO: Change this later I guess, % is weird
			}
		}
	}
}