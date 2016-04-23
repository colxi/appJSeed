## [ 0.0.3 ] - 18-04-2016
### Added
- app.event{} : A complete subClass for app event management. ( Incomplete implementation )
-- Available methods: event.on(), event.off(), event.exist(), event.new(), event.trigger()
- app.scroll() : In conjuction with JQuery simpleScrollBar plugin, allows better scrolling
and window positioning actions.
- app.comon{} : subClass container for storing general use app functions and methods

### Changed
- app.guid() : return now NUMBER-ONLY ID ( withoud slashes )
- some specifications in app.config{} in order to addapt to new functionallities



## [ 0.0.2 ] - 25-03-2016
### Added
- Log levels, in app.log (using an INTEGER value as second argument, to indicate 
the log level)
- New Methods: 
-- app.isError() : Evaluate app.query() server response, and block if _BLOCK_ flag setted on call
-- app.isElement() : Evaluates an object and return true if is a DOM element
-- app.guid() : Generate unique ids
-- app.require() : Import and include remote .js files ( in same domain )

### Changed
- app.loader() : 'block'  flag has been removed until new approach. Previous 
implementation was buggy
- app.message() : 'autohide' flag has been removed until fix to bug with bootstrap modal.

### Fixed
- Bug in app.log() causing incorrect behaviour when unknown or not supported method was passed



## 0.0.1 - 20-02-2016
### First Release
- First approach to Data Structure
- Essential data groups implemented: config, session, view, 
- Essential methods implemented: init, error, alert, query, log , lozder, checkCallback
