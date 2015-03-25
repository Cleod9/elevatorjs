package com.mcleodgaming.elevator.core
{
	public class PersonState
	{
		//Simple enumerator for PersonStates, each number represents a state a Person can be in
		public static var QUEUEING:int = 0; //State to allow the person to trigger ENTERING event only once after first tick 
		public static var ENTERING:int = 1; //Person wants to go towards their floor
		public static var IDLE:int = 2; //Person IDLES on their floor
		public static var LEAVING:int = 3; //Person is ready to LEAVE and want to go to entrance floor
		public static var DONE:int = 4; //Person has "left"
	}
}