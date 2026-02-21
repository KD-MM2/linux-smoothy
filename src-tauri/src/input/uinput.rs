use evdev::{
    uinput::{VirtualDevice, VirtualDeviceBuilder},
    AttributeSet, BusType, EventType, InputEvent, InputId, RelativeAxisType,
};

pub struct ScrollEmitter {
    device: VirtualDevice,
}

impl ScrollEmitter {
    pub fn create() -> Result<Self, String> {
        let mut relative_axes = AttributeSet::<RelativeAxisType>::new();
        relative_axes.insert(RelativeAxisType::REL_WHEEL);
        relative_axes.insert(RelativeAxisType::REL_HWHEEL);
        relative_axes.insert(RelativeAxisType::REL_WHEEL_HI_RES);
        relative_axes.insert(RelativeAxisType::REL_HWHEEL_HI_RES);

        let device = VirtualDeviceBuilder::new()
            .map_err(|error| format!("failed to open /dev/uinput: {error}"))?
            .name("smoothy-virtual-scroll")
            .input_id(InputId::new(BusType::BUS_VIRTUAL, 0x1234, 0x5678, 0x0001))
            .with_relative_axes(&relative_axes)
            .map_err(|error| format!("failed to configure uinput relative axes: {error}"))?
            .build()
            .map_err(|error| format!("failed to create uinput virtual device: {error}"))?;

        Ok(Self { device })
    }

    pub fn emit_vertical_scroll(&mut self, step: i32) -> Result<(), String> {
        if step == 0 {
            return Ok(());
        }

        let event = InputEvent::new(EventType::RELATIVE, RelativeAxisType::REL_WHEEL.0, step);
        self.device
            .emit(&[event])
            .map_err(|error| format!("failed to emit virtual wheel event: {error}"))
    }

    pub fn emit_horizontal_scroll(&mut self, step: i32) -> Result<(), String> {
        if step == 0 {
            return Ok(());
        }

        let event = InputEvent::new(EventType::RELATIVE, RelativeAxisType::REL_HWHEEL.0, step);
        self.device
            .emit(&[event])
            .map_err(|error| format!("failed to emit virtual horizontal wheel event: {error}"))
    }

    pub fn emit_vertical_hires(&mut self, value: i32) -> Result<(), String> {
        if value == 0 {
            return Ok(());
        }

        let event = InputEvent::new(
            EventType::RELATIVE,
            RelativeAxisType::REL_WHEEL_HI_RES.0,
            value,
        );
        self.device
            .emit(&[event])
            .map_err(|error| format!("failed to emit virtual hi-res wheel event: {error}"))
    }

    pub fn emit_horizontal_hires(&mut self, value: i32) -> Result<(), String> {
        if value == 0 {
            return Ok(());
        }

        let event = InputEvent::new(
            EventType::RELATIVE,
            RelativeAxisType::REL_HWHEEL_HI_RES.0,
            value,
        );
        self.device.emit(&[event]).map_err(|error| {
            format!("failed to emit virtual horizontal hi-res wheel event: {error}")
        })
    }
}
