package com.mcleodgaming.elevator.util
{
	public class Debug {
		public static var log:Function;
		public static var warn:Function;
		public static function init():void {
			//Debug.log = DebugAS3.log; //For AS3
			//Debug.warn = DebugAS3.warn;  //For AS3
			Debug.log = DebugJS.log;
			Debug.warn = DebugJS.warn;
		}
	}
}