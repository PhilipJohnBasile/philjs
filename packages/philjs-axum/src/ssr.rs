//! SSR utilities for Axum

/// HTML document builder
pub struct HtmlDocument {
    title: String,
    meta_tags: Vec<MetaTag>,
    scripts: Vec<Script>,
    body: String,
}

impl HtmlDocument {
    pub fn new(title: impl Into<String>) -> Self {
        Self {
            title: title.into(),
            meta_tags: Vec::new(),
            scripts: Vec::new(),
            body: String::new(),
        }
    }

    pub fn meta(mut self, tag: MetaTag) -> Self {
        self.meta_tags.push(tag);
        self
    }

    pub fn script(mut self, script: Script) -> Self {
        self.scripts.push(script);
        self
    }

    pub fn body(mut self, body: impl Into<String>) -> Self {
        self.body = body.into();
        self
    }

    pub fn build(self) -> String {
        format!(
            "<!DOCTYPE html><html><head><title>{}</title></head><body>{}</body></html>",
            self.title, self.body
        )
    }
}

#[derive(Clone)]
pub struct MetaTag {
    name: String,
    content: String,
}

impl MetaTag {
    pub fn name(name: impl Into<String>, content: impl Into<String>) -> Self {
        Self { name: name.into(), content: content.into() }
    }

    fn render(&self) -> String {
        format!("<meta name=\"{}\" content=\"{}\">", self.name, self.content)
    }
}

#[derive(Clone)]
pub struct Script {
    src: String,
}

impl Script {
    pub fn src(src: impl Into<String>) -> Self {
        Self { src: src.into() }
    }

    fn render(&self) -> String {
        format!("<script src=\"{}\"></script>", self.src)
    }
}

pub struct SeoBuilder {
    title: String,
    description: Option<String>,
}

impl SeoBuilder {
    pub fn new(title: impl Into<String>) -> Self {
        Self { title: title.into(), description: None }
    }

    pub fn description(mut self, desc: impl Into<String>) -> Self {
        self.description = Some(desc.into());
        self
    }

    pub fn build(self) -> Vec<MetaTag> {
        let mut tags = vec![];
        if let Some(desc) = self.description {
            tags.push(MetaTag::name("description", desc));
        }
        tags
    }
}
