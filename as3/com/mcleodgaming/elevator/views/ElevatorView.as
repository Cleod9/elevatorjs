package com.mcleodgaming.elevator.views
{
	import com.mcleodgaming.elevator.core.*;
	import com.mcleodgaming.elevator.events.*;

	public class ElevatorView
	{
		public var engine:ElevatorEngine;

		public function ElevatorView(e:ElevatorEngine):void {
			engine = e;
		}
		public function onUpdate(event:ElevatorEngineEvent):void {
		}
		public function getInfo(elevator:Elevator):String {
			//Information to display on the elevators themselves
			var info = "";
			var i = 0;
			info += 'Floor: ' + elevator.currentFloor.name + '<br />';
			info += 'State: ' + ElevatorState.asString(elevator.state) + '<br />';
			info += 'Occupants: <br />';
			if(elevator.people.length <= 0)
				info += '[empty]';
			for(i = 0; i < elevator.people.length; i++)
				info += '-' + elevator.people[i].name + ' (' + elevator.people[i].targetFloor.name + ') ' + '<br />'
			return info;
		}
	}
}