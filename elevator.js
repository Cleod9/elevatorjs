(function ( options ) {
  options = options || {};
  var AS3JSUtils = function () {};
  AS3JSUtils.getDefaultValue = function getDefaultValue(value, fallback) {
    return (typeof value != 'undefined') ? value : fallback;
  };
  AS3JSUtils.createArray = function (size, val) {
    var arr = [];
    for (var i = 0; i < size; i++)  {
      arr.push(val); 
    }
    return arr;
  };
  if (typeof Object.create !== 'function') {
    Object.create = function (o) {
      function F() {}
        F.prototype = o;
        return new F();
    }
  };

  var i, j;
  var packages = {
    "com.mcleodgaming.elevator.core": {
      Elevator: {
        compiled: false,
        source: function ( module ) {
          var ElevatorState, PersonState, ElevatorEvent, EventDispatcher, Debug, FrameTimer;
          module.inject = function () {
            ElevatorState = imports('com.mcleodgaming.elevator.core', 'ElevatorState');
            PersonState = imports('com.mcleodgaming.elevator.core', 'PersonState');
            ElevatorEvent = imports('com.mcleodgaming.elevator.events', 'ElevatorEvent');
            EventDispatcher = imports('com.mcleodgaming.elevator.events', 'EventDispatcher');
            Debug = imports('com.mcleodgaming.elevator.util', 'Debug');
            FrameTimer = imports('com.mcleodgaming.elevator.util', 'FrameTimer');
          };
          
          var Elevator = function(params) {
                this.targetFloors = null;
                this.targetFloorsMemory = null;
                this.floors = null;
                this.currentFloor = null;
                this.entranceFloor = null;
                this.people = null;
                this.speedTimer = null;
                this.waitTimer = null;      //Get settings and set defaults      params = params || {};      this.name = params.name || "[NoName]";      this.capacity = (params.capacity) ? params.capacity : 10;      this.state = params.state || ElevatorState.IDLE;      this.floors = params.floors || [];      this.targetFloors = params.targetFloors || [];      this.currentFloor = (this.floors.length > 0) ? params.currentFloor || this.floors[0] : null;      this.entranceFloor = (this.floors.length > 0) ? params.entranceFloor || this.floors[0] : null;      this.speedTimer = new FrameTimer(params.speedTimer || 30);      this.waitTimer = new FrameTimer(params.waitTimer || 60);      this.people = [];      this.targetFloorsMemory = [];    };
          
          
          
          
          Elevator.prototype.name = null;
          Elevator.prototype.state = 0;
          Elevator.prototype.targetFloors = null;
          Elevator.prototype.targetFloorsMemory = null;
          Elevator.prototype.floors = null;
          Elevator.prototype.currentFloor = null;
          Elevator.prototype.entranceFloor = null;
          Elevator.prototype.people = null;
          Elevator.prototype.speedTimer = null;
          Elevator.prototype.waitTimer = null;
          Elevator.prototype.capacity = 0;
          Elevator.prototype.tick = function() {      //Function to perform each game tick      var index;      if(this.state == ElevatorState.IDLE) {        //Idling on the entrance floor      } else if(this.state == ElevatorState.RISING || this.state == ElevatorState.FALLING) {        //Elevator is currently rising or falling        this.speedTimer.tick();        //If the movement timer reaches 0        if(this.speedTimer.get_IsComplete()) {          //Reset timer and validate the next floor          this.speedTimer.reset();          if(this.nextFloor()) {            //Verify direction state            if((this.nextFloor().index > this.currentFloor.index && this.state == ElevatorState.FALLING) || (this.nextFloor().index < this.currentFloor.index && this.state == ElevatorState.RISING)) {              this.state =  (this.nextFloor().index > this.currentFloor.index) ? ElevatorState.RISING : ElevatorState.FALLING;              Debug.warn("WARNING: HAD TO FORCE FLIP DIRECTION STATE", this);            }          }          //Proceed towards the next floor          var increase = (this.state == ElevatorState.RISING) ? 1 : -1;          //Verify floor destination exists          if(this.currentFloor.index + increase >= this.floors.length || this.currentFloor.index + increase < 0) {            Debug.warn("Problem with elevator: ", this);            //throw new Error("sorta almost went outta bounds", this);          }          //Get next floor index and force in bounds to prevent errors          index = this.targetFloors.indexOf(this.nextFloor());          this.currentFloor = this.floors[Math.max(0, Math.min(this.currentFloor.index + increase, this.floors.length-1))];          //Check to see if this is a target floor          if(this.targetFloors[index] == this.currentFloor) {            this.waitTimer.reset();            //Remove this floor from the targets list            this.targetFloors.splice(index, 1);            //Open doors            this.state = ElevatorState.WAITING;            //Get 1 pass in early            this.processFloor();            //Trigger ARRIVE event            EventDispatcher.dispatcher.dispatchEvent(new ElevatorEvent(ElevatorEvent.ARRIVE, { elevator: this, floor: this.currentFloor  }));          }        }      } else if(this.state == ElevatorState.RETURNING) {        //Elevator is returning towards the entrance        this.speedTimer.tick();        //If the movement timer reaches 0        if(this.speedTimer.get_IsComplete()) {          this.speedTimer.reset();          //Get direction towards entrance floor          var dir = (this.currentFloor < this.entranceFloor) ? 1 : -1;          //Verify floor destination exists          if(this.currentFloor.index + dir >= this.floors.length || this.currentFloor.index + dir < 0) {            Debug.warn("Problem with elevator: ", this);            //throw new Error("sorta almost went outta bounds", this);          }          //Go to the next consecutive floor          this.currentFloor = this.floors[Math.max(0, Math.min(this.currentFloor.index + dir, this.floors.length-1))];          if(this.currentFloor == this.entranceFloor)            this.state = ElevatorState.IDLE; //Idle at entrance          this.waitTimer.reset();        }      } else if(this.state == ElevatorState.WAITING) {        //Elevator is waiting on a floor for passengers, processes the people that want to board each frame        this.processFloor();        this.waitTimer.tick();        if(this.waitTimer.get_IsComplete()) {          //Done waiting          this.waitTimer.reset();          this.speedTimer.reset();          if(this.targetFloors.length <= 0) {            //TODO: Figure out if this is needed (relates to people "pressing buttons" while inside of the elevator)            //dumpFloorMemory();          }          if(!this.nextFloor()) {            //There are no people in the elevator, back to entrance            if(this.people.length > 0) {              //TODO: Consider moving/removing this check              throw new Error("People were left on the elevator while it prepared to go back to the entrance :< ", this)            }            if(this.currentFloor == this.entranceFloor) {              this.state = ElevatorState.IDLE; //At the entrance (TODO: Figure out when can this occur?)            } else {              //Dispatch the RELEASE event              EventDispatcher.dispatcher.dispatchEvent(new ElevatorEvent(ElevatorEvent.RELEASE, { elevator: this }));              //Head towards the entrance floor              this.state = ElevatorState.RETURNING; //Go towards the entrance              //Dispatch the DEPART event              EventDispatcher.dispatcher.dispatchEvent(new ElevatorEvent(ElevatorEvent.DEPART, { elevator: this, floor: this.currentFloor }));            }          } else {            //Decide what to do if we have a floor in our queue            //TODO: Consider removing people length check, the elevator shouldn't be able to know this information            //TODO: Consider removing this if statement altogehter, it may be impossible to enter            if(this.currentFloor == this.entranceFloor && this.people.length <= 0 && this.targetFloors.length <= 0) {              //No one got on the elevator at the entrance floor, begin idling              this.state = ElevatorState.IDLE;              EventDispatcher.dispatcher.dispatchEvent(new ElevatorEvent(ElevatorEvent.NOPASSENGERS, { elevator: this, floor: this.currentFloor }));            } else {              //Move towards the next room              this.state = (this.nextFloor().index > this.currentFloor.index) ? ElevatorState.RISING : ElevatorState.FALLING;              EventDispatcher.dispatcher.dispatchEvent(new ElevatorEvent(ElevatorEvent.DEPART, { elevator: this, floor: this.currentFloor }));            }          }        }      }    };
          Elevator.prototype.dumpFloorMemory = function() {      //Grab floors from memory if there are any      while(this.targetFloorsMemory.length > 0) {        //if(targetFloors.length == 0)          this.queueFloor(this.targetFloorsMemory.splice(0, 1)[0]); //Just add the floor        //else if((isRising() && targetFloorsMemory[index].index > 0) || (isFalling() && targetFloorsMemory[index]))          //queueFloor(targetFloorsMemory.splice(index--, 1)[0]); //Floor is in the same direction we're going already, we can add it      }    };
          Elevator.prototype.nextFloor = function() {      //TODO: Code this to not need the people.length? (use a special targetFloor array or toggle?)      if(this.targetFloors.length <= 0)        return null; //No target floors      if(this.isRising())        return (this.people.length > 0) ? this.targetFloors[0] : this.targetFloors[this.targetFloors.length - 1]; //With people inside next floor is the lowest, otherwise highest      else if(this.isFalling())        return (this.people.length > 0) ? this.targetFloors[this.targetFloors.length - 1] : this.targetFloors[0]; //With people inside next floor is the highest, otherwise lowest      else        return null; //No next floor    };
          Elevator.prototype.isHeadingTowards = function(floor, upwards) {      //Determines if the elevator is headed towards a specific floor in the same queued direction (up or down)      if(upwards)        return (floor && this.isRising() && floor.index > this.currentFloor.index);      else        return (floor && this.isFalling() && floor.index < this.currentFloor.index);    };
          Elevator.prototype.isFree = function() {      //Determine if the elevator is in a state to move immediately      return (this.state == ElevatorState.IDLE || this.state == ElevatorState.RETURNING);    };
          Elevator.prototype.addPerson = function(person) {      //Add a person into the elevator and have them queue their floor      if(this.people.indexOf(person) < 0) {        this.people.push(person);        this.queueFloor(person.targetFloor);      }    };
          Elevator.prototype.removePerson = function(person) {      //Remove a person from the elevator      var index = this.people.indexOf(person);      if(index >= 0)        this.people.splice(index, 1);    };
          Elevator.prototype.queueFloor = function(floor) {      //Attempt to queue a floor      if(!floor || this.targetFloors.indexOf(floor) >= 0)        return; //Cancel if already queued this floor or the floor provided is null      var self = this;      //Function to enqueue a floor via simple insertion sort      var enqueue = function() {        if(self.targetFloors.length <= 0) {          //No targetted floors, free to queue          self.targetFloors.push(floor);          if(self.people.length <= 0) {            //Trigger RESPOND event that a person's button press has been acknowledged            EventDispatcher.dispatcher.dispatchEvent(new ElevatorEvent(ElevatorEvent.RESPOND, { elevator: self, floor: floor }));          }        } else {          //Adds a floor in ascending order          for(var i = 0; i < self.targetFloors.length; i++) {            if(self.targetFloors[i] == floor) {              break; //Already queued this floor            } else if(i < self.targetFloors.length && self.targetFloors[i].index > floor.index) {              self.targetFloors.splice(i, 0, floor);               break; //Insert at this index            } else if(i + 1 >= self.targetFloors.length){              self.targetFloors.push(floor);              break; //Insert at the end of the array            }          }        }      };      if(this.isRising()) {        //If rising, only queue if the pressed floor is in our direction        if(floor.index > this.currentFloor.index)          enqueue();        else {          if(this.targetFloorsMemory.indexOf(floor) < 0)            this.targetFloorsMemory.push(floor); //Someone inside the elevator pressed a floor in the opposite direction        }      } else if (this.isFalling()) {        //If falling, only queue if the pressed floor is in our direction        if(floor.index < this.currentFloor.index)          enqueue();        else {          if(this.targetFloorsMemory.indexOf(floor) < 0)            this.targetFloorsMemory.push(floor); //Someone inside the elevator pressed a floor in the opposite direction        }      } else if(this.isIdling()) {        if(this.currentFloor == floor) {          //Already on the floor so we can just enter waiting state          this.state = ElevatorState.WAITING;        } else {          //We're not already on the floor so enqueue it          enqueue();          if(this.isFree()) {            //We're free so we can go immediately            this.state = (floor.index > this.currentFloor.index) ? ElevatorState.RISING : ElevatorState.FALLING;            EventDispatcher.dispatcher.dispatchEvent(new ElevatorEvent(ElevatorEvent.DEPART, { elevator: this, floor: this.currentFloor }));          }        }      }    };
          Elevator.prototype.hasQueued = function(floor) {      //Determine if a floor has been queued or not      return (this.targetFloors.indexOf(floor) >= 0);    };
          Elevator.prototype.processFloor = function() {      var i;      //Let people off the elevator first      for(i = 0; i < this.people.length; i++) {        //If their target floor is here        if(this.people[i].targetFloor == this.currentFloor) {          //Remove them from the elevator          this.people[i].exitElevator(this.currentFloor);          this.removePerson(this.people[i--]);        }      }      //Allow boarding      for(i = 0; i < this.currentFloor.people.length; i++) {        if(this.people.length >= this.capacity) {          //Trigger FULL event, no more space in elevator          EventDispatcher.dispatcher.dispatchEvent(new ElevatorEvent(ElevatorEvent.FULL, { elevator: this, floor: this.currentFloor, person: this.currentFloor.people[i] }));          break;        }        //Make sure the person wants to get on the elevator        if(this.currentFloor.people[i].state == PersonState.ENTERING || this.currentFloor.people[i].state == PersonState.LEAVING) {          //Make sure going the right direction          if((this.currentFloor.people[i].targetFloor.index > this.currentFloor.index && (this.targetFloors.length <= 0 || this.isRising())) ||            (this.currentFloor.people[i].targetFloor.index < this.currentFloor.index && (this.targetFloors.length <= 0 || this.isFalling()))) {            this.addPerson(this.currentFloor.people[i]);            this.currentFloor.people[i].boardElevator(this);            this.currentFloor.people.splice(i--, 1); //Floor member count decremented          }        }      }    };
          Elevator.prototype.isRising = function() {      //TODO: Check this, probably should be nextFloor()?      //Return true if the next target floor is above this one      return (this.targetFloors.length > 0 && this.targetFloors[0].index > this.currentFloor.index);    };
          Elevator.prototype.isFalling = function() {      //TODO: Check this, probably should be nextFloor()?      //Return true if the next target floor is below this one      return (this.targetFloors.length > 0 && this.targetFloors[0].index < this.currentFloor.index);    };
          Elevator.prototype.isIdling = function() {      //If the elevator is in a non-moving state      return (this.state == ElevatorState.IDLE || this.state == ElevatorState.WAITING || this.state == ElevatorState.RETURNING);    };
          Elevator.prototype.comparePriority = function(otherElevator, targetFloor, upwards) {      var self = this;      //Returns the beest elevator given a target floor, and the direction towards that floor. Swap out this compare function with your own :)      var genericCompare = function() {        if(!otherElevator || otherElevator == self || !targetFloor)          return self;        var nextFloor1 = self.nextFloor();        var nextFloor2 = otherElevator.nextFloor();        var distance1 = targetFloor.index - self.currentFloor.index;        var distance2 = targetFloor.index - otherElevator.currentFloor.index;        //Perform some basic tests to see which elevator is best        if(self.isHeadingTowards(targetFloor, upwards) && otherElevator.isHeadingTowards(targetFloor, upwards)) {          if(self.hasQueued(targetFloor)) {            return self; //This elevator already has the floor queued          } else if(otherElevator.hasQueued(targetFloor)) {            return otherElevator; //This elevator already has the floor queued          } else {            return (Math.abs(distance1) <= Math.abs(distance2)) ? self : otherElevator; //Choose the closer elevator          }        } else if(self.isHeadingTowards(targetFloor, upwards)) {          if(otherElevator.isFree()) {            return (Math.abs(distance1) <= Math.abs(distance2)) ? self : otherElevator; //Choose the closer elevator          } else {            return self; //This elevator is available          }        } else if(otherElevator.isHeadingTowards(targetFloor, upwards)) {          if(self.isFree()) {            return (Math.abs(distance1) <= Math.abs(distance2)) ? self : otherElevator; //Choose the closer elevator          } else {            return otherElevator; //Other elevator is available          }        } else if(self.isFree() && otherElevator.isFree()) {          return (Math.abs(distance1) <= Math.abs(distance2)) ? self : otherElevator; //Choose the closer elevator        } else if(self.isFree()) {          return self; //Other elevator must be busy        } else if(otherElevator.isFree()) {          return otherElevator; //This elevator must be busy        } else {          //Debug.console.warn('Hm.... Some state was not managed in Elevator.comparePriority() ', self);          return null;        }      };      return genericCompare();    }
          
          
          module.exports = Elevator;
          
        }
      }, ElevatorEngine: {
        compiled: false,
        source: function ( module ) {
          var Main, Elevator, ElevatorState, Floor, Person, PersonState, ElevatorEngineEvent, ElevatorEvent, EventDispatcher, PersonEvent, Debug, RandomNameGenerator;
          module.inject = function () {
            Main = imports('com.mcleodgaming.elevator', 'Main');
            Elevator = imports('com.mcleodgaming.elevator.core', 'Elevator');
            ElevatorState = imports('com.mcleodgaming.elevator.core', 'ElevatorState');
            Floor = imports('com.mcleodgaming.elevator.core', 'Floor');
            Person = imports('com.mcleodgaming.elevator.core', 'Person');
            PersonState = imports('com.mcleodgaming.elevator.core', 'PersonState');
            ElevatorEngineEvent = imports('com.mcleodgaming.elevator.events', 'ElevatorEngineEvent');
            ElevatorEvent = imports('com.mcleodgaming.elevator.events', 'ElevatorEvent');
            EventDispatcher = imports('com.mcleodgaming.elevator.events', 'EventDispatcher');
            PersonEvent = imports('com.mcleodgaming.elevator.events', 'PersonEvent');
            Debug = imports('com.mcleodgaming.elevator.util', 'Debug');
            RandomNameGenerator = imports('com.mcleodgaming.elevator.util', 'RandomNameGenerator');
          };
          
          var ElevatorEngine = function(params) {
                this.ticker = null;
                this.elevators = null;
                this.floors = null;
                this.people = null;
                this.queue = null;
                this.entranceFloor = null;      //Get settings      params = params || {};      this.elevators = params.elevators || [];      this.floors = params.floors || [];      this.people = params.people || [];      this.entranceFloor = (params.entranceFloor) ? params.entranceFloor : (this.floors.length > 0) ? this.floors[0] : null;      this.queue = [];      Debug.log("An ElevatorEngine has been created. { elevators: " + this.elevators.length + ", floors: " + this.floors.length + ", people: " + this.people.length + " } ");    };
          
          
          
          ElevatorEngine.generateFloors = function(amount) {      //Generate given amount of floors      var floors = [];      for(var i = 0; (i <= amount && amount >= 12) || (i < amount && amount < 12); i++)        if(amount < 12 || i != 12) /* Skip Floor 13!!! */          floors.push(new Floor({index: i, name: "" +(i+1) }));      return floors;    };
          ElevatorEngine.generateElevators = function(amount, floors, entranceFloor, currentFloor) {      //Generate given amount of elevators      var elevators = [];      for(var i = 0; i < amount; i++)        elevators.push(new Elevator({ name: "" + (i + 1), floors: floors, entranceFloor: entranceFloor, currentFloor: (currentFloor) ? currentFloor : null }));      return elevators;    };
          ElevatorEngine.generatePeople = function(amount, floors, entranceFloor, currentFloor) {      //Generate given amount of people      var people = [];      for(var i = 0; i < amount; i++) {        //Make a random floor        var targetFloor = floors[Math.round(Math.random()*(floors.length-1))];        while(targetFloor == currentFloor || targetFloor == entranceFloor)          targetFloor = floors[Math.round(Math.random()*(floors.length-1))];        var person = new Person({ name: RandomNameGenerator.getRandomName(), floorTimeMax: Math.round(Math.random()*(1000 - 250) + 250), entranceFloor: entranceFloor, currentFloor: (currentFloor) ? currentFloor : null, targetFloor: targetFloor });        people.push(person);        currentFloor.people.push(person);      }      return people;    };
          
          
          ElevatorEngine.prototype.started = false;
          ElevatorEngine.prototype.ticker = null;
          ElevatorEngine.prototype.elevators = null;
          ElevatorEngine.prototype.floors = null;
          ElevatorEngine.prototype.people = null;
          ElevatorEngine.prototype.queue = null;
          ElevatorEngine.prototype.entranceFloor = null;
          ElevatorEngine.prototype.start = function() {      //Starts the ticker      if(!this.started) {        //Add all event listeners        EventDispatcher.dispatcher.addEventListener(PersonEvent.ENTERING, Main.eventHelper(this, this.onPersonEntering));        EventDispatcher.dispatcher.addEventListener(PersonEvent.LEAVING, Main.eventHelper(this, this.onPersonLeaving));        EventDispatcher.dispatcher.addEventListener(PersonEvent.BOARDED, Main.eventHelper(this, this.onPersonBoarded));        EventDispatcher.dispatcher.addEventListener(PersonEvent.DEPARTED, Main.eventHelper(this, this.onPersonDeparted));        EventDispatcher.dispatcher.addEventListener(PersonEvent.DONE, Main.eventHelper(this, this.onPersonDone));        EventDispatcher.dispatcher.addEventListener(ElevatorEvent.ARRIVE, Main.eventHelper(this, this.onElevatorArrive));        EventDispatcher.dispatcher.addEventListener(ElevatorEvent.DEPART, Main.eventHelper(this, this.onElevatorDepart));        EventDispatcher.dispatcher.addEventListener(ElevatorEvent.FULL, Main.eventHelper(this, this.onElevatorFull));        EventDispatcher.dispatcher.addEventListener(ElevatorEvent.RESPOND, Main.eventHelper(this, this.onElevatorRespond));        //Enable ticker        this.started = true;        this.ticker = setInterval(Main.eventHelper(this, this.tick), (1000 / Main.FPS));        Debug.log("ElevatorEngine started.");      } else {        Debug.log("Engine already started");      }    };
          ElevatorEngine.prototype.stop = function() {      //Stops the ticker      if(this.started) {        //Remove all event listeners        EventDispatcher.dispatcher.removeEventListener(PersonEvent.ENTERING);        EventDispatcher.dispatcher.removeEventListener(PersonEvent.LEAVING);        EventDispatcher.dispatcher.removeEventListener(PersonEvent.BOARDED);        EventDispatcher.dispatcher.removeEventListener(PersonEvent.DEPARTED);        EventDispatcher.dispatcher.removeEventListener(PersonEvent.DONE);        EventDispatcher.dispatcher.removeEventListener(ElevatorEvent.ARRIVE);        EventDispatcher.dispatcher.removeEventListener(ElevatorEvent.DEPART);        EventDispatcher.dispatcher.removeEventListener(ElevatorEvent.FULL);        EventDispatcher.dispatcher.removeEventListener(ElevatorEvent.RESPOND);        //Turn off ticker        this.started = false;        clearInterval(this.ticker);        this.ticker = null;        Debug.log("ElevatorEngine stopped.");      } else {        Debug.log("Engine already stopped");      }    };
          ElevatorEngine.prototype.tick = function(e) {
                e = AS3JSUtils.getDefaultValue(e, null);      //Function to perform each tick (the main loop)      var  i;      //Evaluate queue      this.processQueue();      //Run ticks      for(i = 0; i < this.elevators.length; i++)        this.elevators[i].tick();      for(i = 0; i < this.people.length; i++) {        this.people[i].tick();      }      //Get rid of all people who have left      for(i = 0; i < this.people.length; i++)        if(this.people[i].state == PersonState.DONE)          this.people.splice(i--, 1);      EventDispatcher.dispatcher.dispatchEvent(new ElevatorEngineEvent(ElevatorEngineEvent.UPDATE, { engine: this }));    };
          ElevatorEngine.prototype.addPerson = function(person) {      //Person enters the building      this.people.push(person);    };
          ElevatorEngine.prototype.processQueue = function() {      //Process the floor queue (basically simulates the user hitting the up or down button)      var e, p;      for(p = 0; p < this.queue.length; p++) {        if(!this.queue[p].currentFloor) {          //They must have already boarded an elevator          this.queue.splice(p--, 1);          continue;        }        //Use the Elevator's comparePriority() function to determine the best elevator        //Note: I'm looping backwards since my "best elevator" logic will priortize elevators on the "opposite" end of where it starts checking        var bestElevator = null;        for(e = this.elevators.length - 1; e >= 0; e--)          bestElevator = this.elevators[e].comparePriority(bestElevator, this.queue[p].currentFloor, (this.queue[p].targetFloor.index > this.queue[p].currentFloor.index));                //If a best elevator was found        if(bestElevator) {          //Only queue floor if there is not already another elevator on this floor already that's accepting people          for(e = 0; e < this.elevators.length; e++)            if(this.elevators[e] != bestElevator && this.elevators[e].state == ElevatorState.WAITING && this.elevators[e].currentFloor == this.queue[p].currentFloor)              bestElevator = this.elevators[e];          //Officially queue the elevator          bestElevator.queueFloor(this.queue[p].currentFloor);          this.queue.splice(p--, 1);        }      }    };
          ElevatorEngine.prototype.onPersonEntering = function(event) {      this.queue.push(event.data.person);      Debug.log(event.data.person.name + " entered the building on floor: " + event.data.floor.name + " (target floor: " + event.data.person.targetFloor.name + ")");    };
          ElevatorEngine.prototype.onPersonLeaving = function(event) {      this.queue.push(event.data.person);      Debug.log(event.data.person.name + " is ready to leave floor: " + event.data.floor.name);    };
          ElevatorEngine.prototype.onPersonBoarded = function(event) {      Debug.log(event.data.person.name + " boarded elevator " + event.data.elevator.name + ' from floor ' + event.data.elevator.currentFloor.name + ' (going to floor ' + event.data.person.targetFloor.name + ')');    };
          ElevatorEngine.prototype.onPersonDeparted = function(event) {      Debug.log(event.data.person.name + " departed elevator " + event.data.elevator.name + ' (from floor ' + event.data.person.currentFloor.name + ')');    };
          ElevatorEngine.prototype.onPersonDone = function(event) {      Debug.log(event.data.person.name + " has left the building.");    };
          ElevatorEngine.prototype.onElevatorRespond = function(event) {      //When an elevator fills up      Debug.log("Elevator " + event.data.elevator.name + " responded to the request from floor " + event.data.floor.name + ' (currently at floor ' + event.data.elevator.currentFloor.name + ' )');    };
          ElevatorEngine.prototype.onElevatorArrive = function(event) {      //When an elevator arrives on a floor, let other elevators know perhaps?      for(var i = 0; i < this.elevators.length; i++) {        if(this.elevators[i] != event.data.elevator && this.elevators[i].targetFloors.indexOf(event.data.floor) >= 0) {          //TODO: Allow elevator to change course or something under certain conditions?        }      }      var nextFloor = (event.data.elevator.nextFloor()) ? event.data.elevator.nextFloor().name : null;      Debug.log("Elevator " + event.data.elevator.name + " arrived on floor " + event.data.floor.name + ' (nextFloor: ' + nextFloor + ', people: ' + event.data.elevator.people.length + ', targetFloors: ' + event.data.elevator.targetFloors.length + ' )');    };
          ElevatorEngine.prototype.onElevatorDepart = function(event) {      //When an elevator departs a floor      var nextFloor = (event.data.elevator.nextFloor()) ? event.data.elevator.nextFloor().name : null;      Debug.log("Elevator " + event.data.elevator.name + " departed floor " + event.data.floor.name + ' (nextFloor: ' + nextFloor + ', people: ' + event.data.elevator.people.length + ', targetFloors: ' + event.data.elevator.targetFloors.length + ' )');    };
          ElevatorEngine.prototype.onElevatorFull = function(event) {      //When an elevator fills up      Debug.log("Elevator " + event.data.elevator.name + " was full and denied " + event.data.person.name + ' access at floor ' + event.data.floor.name + ' )');    }
          
          
          module.exports = ElevatorEngine;
          
        }
      }, ElevatorState: {
        compiled: false,
        source: function ( module ) {
          module.inject = function () {
            ElevatorState.IDLE = 0;
            ElevatorState.RISING = 1;
            ElevatorState.FALLING = 2;
            ElevatorState.WAITING = 3;
            ElevatorState.RETURNING = 4;
            ElevatorState.BROKEN = 5;
          };
          
          var ElevatorState = function ElevatorState() {};
          
          
          ElevatorState.IDLE = 0;
          ElevatorState.RISING = 1;
          ElevatorState.FALLING = 2;
          ElevatorState.WAITING = 3;
          ElevatorState.RETURNING = 4;
          ElevatorState.BROKEN = 5;
          ElevatorState.asString = function(state) {      //For debugging purposes      return ["IDLE","RISING","FALLING","WAITING", "RETURNING", "BROKEN"][state];    };
          
          
          
          module.exports = ElevatorState;
          
        }
      }, Floor: {
        compiled: false,
        source: function ( module ) {
          
          var Floor = function(params) {
                this.people = null;      //Get settings      params = params || {};      this.index = (typeof params.index == "number") ? params.index : -1;      this.name = params.name || "[No Name]";      this.people = [];    };
          
          
          
          
          Floor.prototype.index = 0;
          Floor.prototype.name = null;
          Floor.prototype.people = null;
          Floor.prototype.removePerson = function(person) {      //Remove a person from the floor      var i = this.people.indexOf(person);      if(i >= 0)        this.people.splice(i, 1)    };
          Floor.prototype.addPerson = function(person) {      //Add a person to the floor      if(this.people.indexOf(person) < 0)        this.people.push(person);    }
          
          
          module.exports = Floor;
          
        }
      }, Person: {
        compiled: false,
        source: function ( module ) {
          var PersonState, EventDispatcher, PersonEvent, FrameTimer;
          module.inject = function () {
            PersonState = imports('com.mcleodgaming.elevator.core', 'PersonState');
            EventDispatcher = imports('com.mcleodgaming.elevator.events', 'EventDispatcher');
            PersonEvent = imports('com.mcleodgaming.elevator.events', 'PersonEvent');
            FrameTimer = imports('com.mcleodgaming.elevator.util', 'FrameTimer');
          };
          
          var Person = function(params) {
                this.entranceFloor = null;
                this.currentFloor = null;
                this.targetFloor = null;
                this.currentElevator = null;
                this.floorTimer = null;      //Get settings      params = params || {};      this.name = params.name || "Unknown";      this.entranceFloor = (params.entranceFloor) ? params.entranceFloor : null;      this.currentFloor = (params.currentFloor) ? params.currentFloor : null;      this.targetFloor = (params.targetFloor) ? params.targetFloor : null;      this.floorTimer = new FrameTimer(params.floorTimer || 1000);      this.state = params.state || PersonState.QUEUEING;      this.waitTimer = 0;    };
          
          
          
          
          Person.prototype.name = null;
          Person.prototype.state = 0;
          Person.prototype.entranceFloor = null;
          Person.prototype.currentFloor = null;
          Person.prototype.targetFloor = null;
          Person.prototype.currentElevator = null;
          Person.prototype.floorTimer = null;
          Person.prototype.waitTimer = 0;
          Person.prototype.isReady = function() {      //Returns true if the person is ready to leave their floor      return this.floorTimer.get_IsComplete();    };
          Person.prototype.resetTime = function() {      //Resets the amount of time the user wants to remain on the floor      this.floorTimer.reset();    };
          Person.prototype.waitTime = function() {      //Returns the total time the user has been in the isReady() state and been stuck waiting      return this.waitTimer;    };
          Person.prototype.boardElevator = function(elevator) {      //Leave floor, enter elevator      var oldFloor = this.currentFloor;      this.currentElevator = elevator;      this.currentFloor.removePerson(this);      this.currentFloor = null;      EventDispatcher.dispatcher.dispatchEvent(new PersonEvent(PersonEvent.BOARDED, { elevator: elevator, person: this, floor: oldFloor }));    };
          Person.prototype.exitElevator = function(floor) {      //Exit elevator, enter floor      var tmpElevator = this.currentElevator;      this.currentElevator = null;      var tmpFloor = this.currentFloor = floor;      this.currentFloor.addPerson(this);      this.resetTime();      if(this.state == PersonState.ENTERING) {        //They are just entering the building so now they want to stay IDLE on this floor        this.state = PersonState.IDLE;        EventDispatcher.dispatcher.dispatchEvent(new PersonEvent(PersonEvent.DEPARTED, { elevator: tmpElevator, person: this, floor: this.currentFloor }));        EventDispatcher.dispatcher.dispatchEvent(new PersonEvent(PersonEvent.WAITING, { person: this }));      } else if(this.state == PersonState.LEAVING) {        //The person had been on their way out of the building, so have them enter their DONE state        EventDispatcher.dispatcher.dispatchEvent(new PersonEvent(PersonEvent.DEPARTED, { elevator: tmpElevator, person: this, floor: tmpFloor }));        this.currentFloor.removePerson(this);        this.currentFloor = null;        this.state = PersonState.DONE;        EventDispatcher.dispatcher.dispatchEvent(new PersonEvent(PersonEvent.DONE, { person: this, floor: tmpFloor }));      } else {        //This state should be impossible        throw new Error("[Person] Some Unhandled state in Person");      }    };
          Person.prototype.tick = function() {      if(this.state == PersonState.QUEUEING) {        //Immediately allow the person into their ENTERING state (QUEING state is just so we can do a one-time ENTERING event trigger)        this.state = PersonState.ENTERING;        EventDispatcher.dispatcher.dispatchEvent(new PersonEvent(PersonEvent.ENTERING, { person: this, floor: this.currentFloor }));      } else if(this.state == PersonState.IDLE) {        //The person is IDLING on a floor        if(this.currentFloor) {          this.floorTimer.tick();          if(this.floorTimer.get_IsComplete()) {            //The person is done on the floor, they want to enter LEAVING state            this.waitTimer = 0;            this.floorTimer.reset();            this.state = PersonState.LEAVING;            this.targetFloor = this.entranceFloor;            EventDispatcher.dispatcher.dispatchEvent(new PersonEvent(PersonEvent.LEAVING, { person: this, floor: this.currentFloor }));          }        }      } else if((this.state == PersonState.LEAVING || this.state ==PersonState.ENTERING) && !this.currentElevator) {        this.waitTimer++;      }    }
          
          
          module.exports = Person;
          
        }
      }, PersonState: {
        compiled: false,
        source: function ( module ) {
          module.inject = function () {
            PersonState.QUEUEING = 0;
            PersonState.ENTERING = 1;
            PersonState.IDLE = 2;
            PersonState.LEAVING = 3;
            PersonState.DONE = 4;
          };
          
          var PersonState = function PersonState() {};
          
          
          PersonState.QUEUEING = 0;
          PersonState.ENTERING = 1;
          PersonState.IDLE = 2;
          PersonState.LEAVING = 3;
          PersonState.DONE = 4;
          
          
          
          module.exports = PersonState;
          
        }
      }
    }, "com.mcleodgaming.elevator.events": {
      ElevatorEngineEvent: {
        compiled: false,
        source: function ( module ) {
          var Event = imports('com.mcleodgaming.elevator.events', 'Event');
          module.inject = function () {
            ElevatorEngineEvent.UPDATE = "elevatorEngineUpdate";
          };
          
          var ElevatorEngineEvent = function(type, data) {      Event.call(this, type, data);    };
          
          ElevatorEngineEvent.prototype = Object.create(Event.prototype);
          
          ElevatorEngineEvent.UPDATE = null;
          
          
          
          module.exports = ElevatorEngineEvent;
          
        }
      }, ElevatorEvent: {
        compiled: false,
        source: function ( module ) {
          var Event = imports('com.mcleodgaming.elevator.events', 'Event');
          module.inject = function () {
            ElevatorEvent.ARRIVE = "elevatorArrive";
            ElevatorEvent.DEPART = "elevatorDepart";
            ElevatorEvent.RESPOND = "elevatorRespond";
            ElevatorEvent.RELEASE = "elevatorRelease";
            ElevatorEvent.NOPASSENGERS = "elevatorNoPassengers";
            ElevatorEvent.OVERBURDENED = "elevatorOverburdened";
            ElevatorEvent.FULL = "elevatorFull";
          };
          
          var ElevatorEvent = function(typeVal, dataVal) {      Event.call(this, typeVal, dataVal);    };
          
          ElevatorEvent.prototype = Object.create(Event.prototype);
          
          ElevatorEvent.ARRIVE = null;
          ElevatorEvent.DEPART = null;
          ElevatorEvent.RESPOND = null;
          ElevatorEvent.RELEASE = null;
          ElevatorEvent.NOPASSENGERS = null;
          ElevatorEvent.OVERBURDENED = null;
          ElevatorEvent.FULL = null;
          
          
          
          module.exports = ElevatorEvent;
          
        }
      }, Event: {
        compiled: false,
        source: function ( module ) {
          
          var Event = function(typeVal, dataVal) {
                this.data = null;      this.type = typeVal || "event";      this.data = dataVal || {};    };
          
          
          
          
          Event.prototype.type = null;
          Event.prototype.data = null
          
          
          module.exports = Event;
          
        }
      }, EventDispatcher: {
        compiled: false,
        source: function ( module ) {
          var Debug;
          module.inject = function () {
            Debug = imports('com.mcleodgaming.elevator.util', 'Debug');
            EventDispatcher.debug = false;
            EventDispatcher.dispatcher = null;
          };
          
          var EventDispatcher = function() {
                this._eventList = null;      this._eventList = {};    };
          
          
          
          EventDispatcher.debug = false;
          EventDispatcher.dispatcher = null;
          EventDispatcher.init = function() {      EventDispatcher.dispatcher = new EventDispatcher();    };
          
          
          EventDispatcher.prototype._eventList = null;
          EventDispatcher.prototype.addEventListener = function(type, listener) {      if(typeof listener != 'function')        throw new Error("[EventDispatcher] Error, provided event listener is not a function");      //Save the event under its name in our eventList Dictionary      if(!this._eventList[type])        this._eventList[type] = [];      this._eventList[type].push({ listener: listener});    };
          EventDispatcher.prototype.removeEventListener = function(type, listener) {
                listener = AS3JSUtils.getDefaultValue(listener, null);      //Check our event list for listeners of this type, and remove      if(this._eventList[type]) {        for(var i = 0; i < this._eventList[type].length; i++)          if(!listener || listener == this._eventList[type][i].listener)            this._eventList[type].splice(i--, 1);        //Could delete events of the this type if there are none left, but not necessary since it can be reused (and would probably break removeAllEvents() anyway)        /*if(_eventList[type].length <= 0) {          //Delete this listener type from the dictionar          _eventList[type] = null;          delete _eventList[type];        }*/      }    };
          EventDispatcher.prototype.dispatchEvent = function(event) {      //Trigger all event of this type      if(this._eventList[event.type]) {        for(var i = 0; i < this._eventList[event.type].length; i++)          this._eventList[event.type][i].listener(event);      }      if(EventDispatcher.debug)        Debug.log("[Event \"" + event.type + "\"]");    };
          EventDispatcher.prototype.hasEvent = function(type, listener) {
                listener = AS3JSUtils.getDefaultValue(listener, null);      //Determine if an event exists (can filter by listener)      if(this._eventList[type]) {        for(var i = 0; i < this._eventList[type].length; i++)          if(!listener || listener == this._eventList[type][i].listener)            return true;      }      return false;    };
          EventDispatcher.prototype.removeAllEvents = function() {      //Remove all events      for(var i in this._eventList) {        this.removeEventListener(i);        this._eventList[i] = null;      }      this._eventList = null;      this._eventList = {};    };
          EventDispatcher.prototype.getCount = function(type) {
                type = AS3JSUtils.getDefaultValue(type, null);      if(!type) {        //Total all events        var total = 0;        for(var i in this._eventList)          total += this._eventList[i].length;        return total;      } else {        //Total events of a specific type        return (this._eventList[type]) ? this._eventList[type].length : 0;      }    }
          
          
          module.exports = EventDispatcher;
          
        }
      }, PersonEvent: {
        compiled: false,
        source: function ( module ) {
          var Event = imports('com.mcleodgaming.elevator.events', 'Event');
          module.inject = function () {
            PersonEvent.ENTERING = "personEntering";
            PersonEvent.BOARDED = "personBoarded";
            PersonEvent.WAITING = "personWaiting";
            PersonEvent.LEAVING = "personLeaving";
            PersonEvent.DEPARTED = "personDeparted";
            PersonEvent.DONE = "personDone";
          };
          
          var PersonEvent = function(typeVal, dataVal) {      Event.call(this, typeVal, dataVal);    };
          
          PersonEvent.prototype = Object.create(Event.prototype);
          
          PersonEvent.ENTERING = null;
          PersonEvent.BOARDED = null;
          PersonEvent.WAITING = null;
          PersonEvent.LEAVING = null;
          PersonEvent.DEPARTED = null;
          PersonEvent.DONE = null;
          
          
          
          module.exports = PersonEvent;
          
        }
      }
    }, "com.mcleodgaming.elevator": {
      Main: {
        compiled: false,
        source: function ( module ) {
          var Debug, ElevatorEngine, ElevatorViewJS, EventDispatcher;
          module.inject = function () {
            Debug = imports('com.mcleodgaming.elevator.util', 'Debug');
            ElevatorEngine = imports('com.mcleodgaming.elevator.core', 'ElevatorEngine');
            ElevatorViewJS = imports('com.mcleodgaming.elevator.views', 'ElevatorViewJS');
            EventDispatcher = imports('com.mcleodgaming.elevator.events', 'EventDispatcher');
            Main.ROOT = null;
            Main.FPS = 30;
          };
          
          var Main = function() {
                this.engine = null;
                this.view = null;
                this.addPeopleInterval = null;
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
                this.engine = new ElevatorEngine({
                  entranceFloor: floors[0],
                  elevators: elevators,
                  floors: floors,
                  people: people
                });
          
                //Start the engine
                this.engine.start();
          
                //Start the people adding timer
                this.startAddingPeople();
          
                //Attach a view so we can visualize
                //view = new ElevatorView(engine); //For template version (no
                //view = new ElevatorViewAS3(engine); //For AS3 Version
                this.view = new ElevatorViewJS(this.engine); //For JS Version
              };
          
          
          
          Main.ROOT = null;
          Main.FPS = 30;
          Main.eventHelper = function(context, fn) {
                //Helps with binding events to 'this'
                return function(e) {
                  return fn.call(context, e);
                };
              };
          
          
          Main.prototype.engine = null;
          Main.prototype.view = null;
          Main.prototype.addingPeople = false;
          Main.prototype.addPeopleInterval = null;
          Main.prototype.addPeople = function(e) {
                e = AS3JSUtils.getDefaultValue(e, null);
                //Add a random amount of people to the elevator engine
                var people = ElevatorEngine.generatePeople(Math.round(Math.random()*(5-1) + 1), this.engine.floors, this.engine.floors[0], this.engine.floors[0]);
                for(var i = 0; i < people.length; i++)
                  this.engine.addPerson(people[i]);
              };
          Main.prototype.startAddingPeople = function() {
                if(!this.addingPeople) {
                  //Turn on the people adding timer
                  this.addingPeople = true;
                  this.addPeopleInterval = setInterval(Main.eventHelper(this, this.addPeople), 5000);
                  Debug.log("Started adding people.")
                } else {
                  Debug.log("Already adding people.")
                }
              };
          Main.prototype.stopAddingPeople = function() {
                if(this.addingPeople) {
                  //Turn off the people adding timer
                  this.addingPeople = false;
                  clearInterval(this.addPeopleInterval);
                  Debug.log("Stopped adding people.")
                } else {
                  Debug.log("Not currently adding people.")
                }
              }
          
          
          module.exports = Main;
          
        }
      }
    }, "com.mcleodgaming.elevator.util": {
      Debug: {
        compiled: false,
        source: function ( module ) {
          var DebugJS;
          module.inject = function () {
            DebugJS = imports('com.mcleodgaming.elevator.util', 'DebugJS');
            Debug.log = null;
            Debug.warn = null;
          };
          
          var Debug = function Debug() {};
          
          
          Debug.log = null;
          Debug.warn = null;
          Debug.init = function() {
                //Debug.log = DebugAS3.log; //For AS3
                //Debug.warn = DebugAS3.warn;  //For AS3
                Debug.log = DebugJS.log;
                Debug.warn = DebugJS.warn;
              };
          
          
          
          module.exports = Debug;
          
        }
      }, DebugAS3: {
        compiled: false,
        source: function ( module ) {
          
          var DebugAS3 = function DebugAS3() {};
          
          
          DebugAS3.log = function() {
                var rest = Array.prototype.slice.call(arguments).splice(0);      trace.apply(null, rest);    };
          DebugAS3.warn = function() {
                var rest = Array.prototype.slice.call(arguments).splice(0);      trace.apply(null, rest);    };
          
          
          
          module.exports = DebugAS3;
          
        }
      }, DebugJS: {
        compiled: false,
        source: function ( module ) {
          
          var DebugJS = function DebugJS() {};
          
          
          DebugJS.log = function() {      console.log.apply(console, arguments);    };
          DebugJS.warn = function() {      console.warn(console, arguments);    };
          
          
          
          module.exports = DebugJS;
          
        }
      }, FrameTimer: {
        compiled: false,
        source: function ( module ) {
          
          var FrameTimer = function(length) {      this.m_initTime = length;      this.m_currentTime = 0;    };
          
          
          
          
          FrameTimer.prototype.get_IsComplete = function() {      return Boolean(this.m_currentTime >= this.m_initTime);    };
          FrameTimer.prototype.get_MaxTime = function() {      return this.m_initTime;    };
          FrameTimer.prototype.get_CurrentTime = function() {      return this.m_currentTime;    };
          FrameTimer.prototype.set_MaxTime = function(value) {      if (value < 0)      {        this.m_initTime = 0;      } else      {        this.m_initTime = value;        if (this.m_currentTime > this.m_initTime)        {          this.m_currentTime = this.m_initTime;        }      }    };
          FrameTimer.prototype.set_CurrentTime = function(value) {      if (value < 0)      {        this.m_currentTime = 0;      } else      {        this.m_currentTime = (value > this.get_MaxTime()) ? this.get_MaxTime() : value;      }    };
          FrameTimer.prototype.m_initTime = 0;
          FrameTimer.prototype.m_currentTime = 0;
          FrameTimer.prototype.tick = function(amount) {
                amount = AS3JSUtils.getDefaultValue(amount, 1);      if (this.m_currentTime < this.m_initTime)      {        this.m_currentTime = Math.min(this.m_initTime, this.m_currentTime + amount);//Just making it a bit faster. Might matter if it ticks a lot to remove 1 read/math/store operation      }    };
          FrameTimer.prototype.finish = function() {      this.m_currentTime = this.m_initTime;    };
          FrameTimer.prototype.reset = function() {      this.m_currentTime = 0;    }
          
          
          module.exports = FrameTimer;
          
        }
      }, RandomNameGenerator: {
        compiled: false,
        source: function ( module ) {
          module.inject = function () {
            RandomNameGenerator.names = ["Derek","Reginald","Hubert","Woodrow","Norma","Cheryl","Allison","Jamie","Bessie","Corey","Emily","Jeremiah","Lana","Rosemary","Willie","Alfred","Rex","Tomas","Carol","Bernard","Dean","Jan","Salvador","Antonio","John","Spencer","Bill","Angel","Clarence","Bethany","Joan","Jenna","Loretta","Marie","Jonathan","Kristi","Dolores","Eloise","Latoya","Krista","Earnest","Eduardo","Darin","Francis","Pauline","Arturo","Preston","Rosie","Sandra","Denise","Kari","Amanda","James","Darla","Alexis","Leon","Penny","Roland","Mark","Evan","Amos","Jennie","Susie","Peter","Johanna","Frederick","Christopher","Kerry","Taylor","Luz","Laverne","Greg","Marcus","Luke","Toby","Olivia","Patsy","Paula","Alex","Ernest","Myrtle","Ernesto","Eleanor","Nicole","Ivan","Claudia","Ray","Byron","Grace","Jenny","Glenda","Pablo","Maryann","Perry","Susan","Virginia","Jan","Ellen","Elsie","Hugh"];
          };
          
          var RandomNameGenerator = function RandomNameGenerator() {};
          
          
          RandomNameGenerator.names = null;
          RandomNameGenerator.getRandomName = function() {      return RandomNameGenerator.names[Math.round(Math.random() * (RandomNameGenerator.names.length-1))];    };
          
          
          
          module.exports = RandomNameGenerator;
          
        }
      }
    }, "com.mcleodgaming.elevator.views": {
      ElevatorView: {
        compiled: false,
        source: function ( module ) {
          var ElevatorState;
          module.inject = function () {
            ElevatorState = imports('com.mcleodgaming.elevator.core', 'ElevatorState');
          };
          
          var ElevatorView = function(e) {
                this.engine = null;
                this.engine = e;
              };
          
          
          
          
          ElevatorView.prototype.engine = null;
          ElevatorView.prototype.onUpdate = function(event) {
              };
          ElevatorView.prototype.getInfo = function(elevator) {
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
          
          
          module.exports = ElevatorView;
          
        }
      }, ElevatorViewAS3: {
        compiled: false,
        source: function ( module ) {
          var ElevatorView = imports('com.mcleodgaming.elevator.views', 'ElevatorView');
          var Main, ElevatorEngineEvent, EventDispatcher, PersonState;
          module.inject = function () {
            Main = imports('com.mcleodgaming.elevator', 'Main');
            ElevatorEngineEvent = imports('com.mcleodgaming.elevator.events', 'ElevatorEngineEvent');
            EventDispatcher = imports('com.mcleodgaming.elevator.events', 'EventDispatcher');
            PersonState = imports('com.mcleodgaming.elevator.core', 'PersonState');
          };
          
          var ElevatorViewAS3 = function(e) {
                this.elevatorContainer = null;
                this.elevatorMCs = null;
                this.pauseButton = null;
                this.floorTable = null;
                this.floorMCs = null;      ElevatorView.call(this, e);      var self = this;      var i, mc, txtField;      //Create display elements      this.elevatorContainer = new MovieClip();      this.elevatorContainer.graphics.beginFill(0xffffff);      this.elevatorContainer.graphics.lineStyle(1, 0x000000);      this.elevatorContainer.graphics.drawRect(0, 0, Main.ROOT.stage.width, Main.ROOT.stage.height);      this.elevatorContainer.graphics.endFill();      this.elevatorMCs = [];      for(i = 0; i < this.engine.elevators.length; i++) {        mc = new MovieClip(); //New elevator MC        mc.x = 100 * i + 100;        mc.y = 300;        mc.graphics.beginFill(0xffffff);        mc.graphics.lineStyle(1, 0x000000);        mc.graphics.drawRect(0, 0, 100, 150);        mc.graphics.endFill();        txtField = new TextField(); //Text field        txtField.width = 100;        txtField.height = 150;        txtField.name = "txt";        mc.addChild(txtField); //Add text field to elevator MC        this.elevatorMCs.push(mc); //Add elevator MC to list        this.elevatorContainer.addChild(mc); //Add to main container      }      //Build floor table      this.floorTable = new MovieClip();      this.floorMCs = [];      for(i = 0; i < this.engine.floors.length; i++) {        mc = new MovieClip(); //New elevator MC        mc.y = 45 * i;        mc.graphics.beginFill(0xffffff);        mc.graphics.lineStyle(1, 0x000000);        mc.graphics.drawRect(0, 0, 100, 45);        mc.graphics.endFill();        txtField = new TextField();        txtField.width = 100;        txtField.height = 45;        txtField.multiline = true;        txtField.wordWrap = true;        txtField.name = "txt";        mc.addChild(txtField);        this.floorTable.addChild(mc);        this.floorMCs.push(mc);      }      //Make pause button to start/stop the engine and people adding timer      this.pauseButton = new MovieClip();      this.pauseButton.ispaused = false;      this.pauseButton.x = 600;      this.pauseButton.graphics.beginFill(0xffffff);      this.pauseButton.graphics.lineStyle(1, 0xffffff);      this.pauseButton.graphics.drawRect(0, 0, 100, 45);      this.pauseButton.graphics.endFill();      this.pauseButton.useHandCursor = true;      this.pauseButton.mouseChildren = false;      this.pauseButton.buttonMode = true;      txtField = new TextField();      txtField.width = 200;      txtField.height = 300;      txtField.selectable = false;      txtField.name = "txt";      txtField.text = "Pause";      txtField.mouseEnabled = false;      this.pauseButton.addEventListener(MouseEvent.CLICK, function(e) {        this.pauseButton.ispaused = !this.pauseButton.ispaused;        if(this.pauseButton.ispaused) {          TextField(this.pauseButton.getChildByName('txt')).text = "Play";          Main.ROOT.stopAddingPeople();          self.engine.stop();        } else {          TextField(this.pauseButton.getChildByName('txt')).text = "Pause";          self.engine.start();          Main.ROOT.startAddingPeople();        }      });      this.pauseButton.addChild(txtField);      //Add to ROOT      Main.ROOT.addChild(this.elevatorContainer);      Main.ROOT.addChild(this.floorTable);      Main.ROOT.addChild(this.pauseButton);      //Ready to accept events      EventDispatcher.dispatcher.addEventListener(ElevatorEngineEvent.UPDATE, this.onUpdate);      trace('Initialized ElevatorView');    };
          
          ElevatorViewAS3.prototype = Object.create(ElevatorView.prototype);
          
          
          ElevatorViewAS3.prototype.elevatorContainer = null;
          ElevatorViewAS3.prototype.elevatorMCs = null;
          ElevatorViewAS3.prototype.pauseButton = null;
          ElevatorViewAS3.prototype.floorTable = null;
          ElevatorViewAS3.prototype.floorMCs = null;
          ElevatorViewAS3.prototype.onUpdate = function(event) {      var i, j;      //For each floor (Floor Table View)      for(i = 0; i < this.engine.floors.length; i++) {        TextField(this.floorMCs[this.engine.floors.length - i - 1].getChildByName('txt')).text = 'Floor ' + (i+1) + ': ';        //For each person on this floor        for(j = 0; j < this.engine.floors[i].people.length; j++) {          var prepend = (j > 0) ? ", " : "";          if(this.engine.queue.indexOf(this.engine.floors[i].people[j]) >= 0)            prepend += "*"; //Button press yet to be acknowledged          else if(this.engine.floors[i].people[j].state == PersonState.LEAVING || this.engine.floors[i].people[j].state == PersonState.ENTERING)            prepend += "+"; //Some elevator has responded to their button press          //Concatenate all of the people (placing in the table from the bottom up)          TextField(this.floorMCs[this.engine.floors.length - i - 1].getChildByName('txt')).text += (prepend + this.engine.floors[i].people[j].name + '(' + this.engine.floors[i].people[j].targetFloor.name + ')');        }      }      //Render elevators (Elevator View)      for(i = 0; i < this.engine.elevators.length; i++) {        var height = (this.elevatorMCs[i].height / this.elevatorContainer.height * 84); //<-Weird guessing to get the elevators to fit in the window        var offset = (this.engine.elevators[i].currentFloor.index / this.engine.floors.length * height);        this.elevatorMCs[i].y = 300 - Math.round(offset) * 10; //Lol guessing position here        TextField(this.elevatorMCs[i].getChildByName('txt')).text = this.getInfo(this.engine.elevators[i]);      }    };
          ElevatorViewAS3.prototype.getInfo = function(elevator) {      return ElevatorView.prototype.getInfo.call(this, elevator).split("<br />").join("\n");    }
          
          
          module.exports = ElevatorViewAS3;
          
        }
      }, ElevatorViewJS: {
        compiled: false,
        source: function ( module ) {
          var ElevatorView = imports('com.mcleodgaming.elevator.views', 'ElevatorView');
          var Main, PersonState, ElevatorEngineEvent, EventDispatcher, Debug;
          module.inject = function () {
            Main = imports('com.mcleodgaming.elevator', 'Main');
            PersonState = imports('com.mcleodgaming.elevator.core', 'PersonState');
            ElevatorEngineEvent = imports('com.mcleodgaming.elevator.events', 'ElevatorEngineEvent');
            EventDispatcher = imports('com.mcleodgaming.elevator.events', 'EventDispatcher');
            Debug = imports('com.mcleodgaming.elevator.util', 'Debug');
          };
          
          var ElevatorViewJS = function(e) {
                this.elevatorTable = null;
                this.elevatorRow = null;
                this.elevatorColumns = null;
                this.floorTable = null;
                ElevatorView.call(this, e);
                var i;
                var self = this;
                this.engine = e;
          
                //Create table elements
                this.elevatorTable = $('.elevator-view tbody');
                this.elevatorRow = $('<tr/>'); //Store this for easy direct reference to rows
                this.elevatorColumns = []; //Will place the columns to display elevators in here
                this.elevatorTable.append(this.elevatorRow); //Add the row to the elevator table
          
                //Build floor table
                this.floorTable = $('.floor-view');
                for(i = this.engine.floors.length - 1; i >= 0; i--) {
                  this.floorTable.append('<tr><td class="title">Floor ' + this.engine.floors[i].name + ':</td><td class="data"></td></tr>')
                }
          
                //Make pause button to start/stop the engine and people adding timer
                this.pauseToggle = $('.btn-pause');
                this.pauseToggle.click(function() {
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
                for(i = 0; i < this.engine.elevators.length; i++) {
                  var col = $('<td/>').append($('<div/>').addClass('elevator'));
                  this.elevatorColumns.push(col);
                  this.elevatorRow.append(col);
                }
                
                //Ready to accept events
                EventDispatcher.dispatcher.addEventListener(ElevatorEngineEvent.UPDATE, Main.eventHelper(this, this.onUpdate));
          
                Debug.log('Initialized ElevatorView');
              };
          
          ElevatorViewJS.prototype = Object.create(ElevatorView.prototype);
          
          
          ElevatorViewJS.prototype.pauseToggle = false;
          ElevatorViewJS.prototype.elevatorTable = null;
          ElevatorViewJS.prototype.elevatorRow = null;
          ElevatorViewJS.prototype.elevatorColumns = null;
          ElevatorViewJS.prototype.floorTable = null;
          ElevatorViewJS.prototype.onUpdate = function(event) {
                var i, j;
                //For each floor (Floor Table View)
                for(i = 0; i < this.engine.floors.length; i++) {
                  $('tr', this.floorTable).eq(this.engine.floors.length - i - 1).find('.data').text('');
                  //For each person on this floor
                  for(j = 0; j < this.engine.floors[i].people.length; j++) {
                    var prepend = (j > 0) ? ", " : "";
                    if(this.engine.queue.indexOf(this.engine.floors[i].people[j]) >= 0)
                      prepend += "*"; //Button press yet to be acknowledged
                    else if(this.engine.floors[i].people[j].state == PersonState.LEAVING || this.engine.floors[i].people[j].state == PersonState.ENTERING)
                      prepend += "+"; //Some elevator has responded to their button press
                    //Concatenate all of the people (placing in the table from the bottom up)
                    $('tr', this.floorTable).eq(this.engine.floors.length - i - 1).find('.data').append(prepend + this.engine.floors[i].people[j].name + '(' + this.engine.floors[i].people[j].targetFloor.name + ')');
                  }
                }
                //Render elevators (Elevator View)
                for(i = 0; i < this.engine.elevators.length; i++) {
                  var height = (this.elevatorColumns[i].height() / this.elevatorTable.height() * 84); //<-Weird guessing to get the elevators to fit in the window
                  var offset = (this.engine.elevators[i].currentFloor.index / this.engine.floors.length * height);
                  this.elevatorColumns[i].find('.elevator').css('bottom', Math.round(offset) + '%').html(this.getInfo(this.engine.elevators[i])); //<-TODO: Change this later I guess, % is weird
                }
              }
          
          
          module.exports = ElevatorViewJS;
          
        }
      }
    }
  };

  var imports = function ( packageName, className ) {
    if (!packages[packageName][className].compiled) {
      packages[packageName][className].compiled = true;
      packages[packageName][className].module = { exports: null, inject: null };
      packages[packageName][className].source(packages[packageName][className].module);
    }
    return packages[packageName][className].module.exports;
  };

  for (i in packages) {
    for (j in packages[i]) {
      imports(i, j);
    }
  }
  for (i in packages) {
    // Execute the injection functions
    for (j in packages[i]) {
      if (typeof packages[i][j].module.inject === 'function') {
        packages[i][j].module.inject();
      }
    }
  }

  if (options.entryPackage && options.entryClass) {
    var entryPoint = imports(options.entryPackage, options.entryClass);
    if (options.entryMode === "new") {
      new entryPoint();
    } else if (options.entryMode === "exports" && typeof module !== 'undefined') {
      module.exports = entryPoint;
    }
  }
})({ entryPackage: "com.mcleodgaming.elevator", entryClass: "Main", entryMode: "new" });