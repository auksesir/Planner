import React from 'react';

// Export mock components that can be imported in your tests
export const TextField = props => <input data-testid="mui-textfield" {...props} />;
export const IconButton = props => <button data-testid="mui-iconbutton" {...props} />;
export const InputAdornment = props => <div data-testid="mui-inputadornment" {...props} />;
export const Menu = props => <div data-testid="mui-menu" {...props} />;
export const MenuItem = props => <div data-testid="mui-menuitem" {...props} />;
export const DatePicker = props => <div data-testid="mui-datepicker">{props.label}</div>;
export const TimePicker = props => <div data-testid="mui-timepicker">{props.label}</div>;
export const LocalizationProvider = ({ children }) => <div data-testid="mui-localizationprovider">{children}</div>;
export const AdapterDateFns = () => <div data-testid="mui-adapterdatefns" />;