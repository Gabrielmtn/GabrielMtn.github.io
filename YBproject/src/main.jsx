import React from 'react';

let App = React.createClass({
  render () {
    return (
      <div>
        <h1>Welcome to the Jungle</h1>
      </div>
    );
  }
});

React.render(<App/>, document.body);

var Stage = ReactPIXI.Stage;
var TilingSprite = ReactPIXI.TilingSprite;
var Text = ReactPIXI.Text;

var ExampleStage = React.createClass({
  displayName: 'ExampleStage',
  render: function() {
    var fontstyle = {font:'40px Times'};
    return <Stage width={this.props.width} height={this.props.height}>
    <TilingSprite image={assetpath('bg_castle.png')} width={this.props.width} height={this.props.height} key="1" />
    <Text text="Vector text" x={this.props.xposition} y={10} style={fontstyle} anchor={new PIXI.Point(0.5,0)} key="2" />
    </Stage>;
  }
});